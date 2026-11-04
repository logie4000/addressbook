"""Cognito pre sign-up trigger: lets Google sign in only invited people.

The first time someone signs in with Google, Cognito would normally create a
new account for them. Instead, this looks for an account you created with
`aws cognito-idp admin-create-user` that has the same (verified) email. If
there is one, the Google login is linked to it, so the person keeps a single
account whichever way they sign in. If there isn't, sign-in is refused.
"""

import boto3

cognito = boto3.client("cognito-idp")

NOT_INVITED = "This Google account has not been invited to the address book."


def handler(event, context):
    # Password sign-ups can't happen (only admins create users), and admin
    # creation needs no checks. Only Google logins are handled here.
    if event["triggerSource"] != "PreSignUp_ExternalProvider":
        return event

    attributes = event["request"]["userAttributes"]
    email = attributes.get("email", "").strip().lower()
    if not email or str(attributes.get("email_verified", "")).lower() != "true":
        raise Exception(NOT_INVITED)

    user = find_invited_user(event["userPoolId"], email)
    if user is None:
        raise Exception(NOT_INVITED)

    # userName is "<provider>_<subject>", e.g. "google_1234567890".
    provider, _, subject = event["userName"].partition("_")
    cognito.admin_link_provider_for_user(
        UserPoolId=event["userPoolId"],
        DestinationUser={"ProviderName": "Cognito", "ProviderAttributeValue": user["Username"]},
        SourceUser={
            "ProviderName": "Google" if provider.lower() == "google" else provider,
            "ProviderAttributeName": "Cognito_Subject",
            "ProviderAttributeValue": subject,
        },
    )
    return event


def find_invited_user(user_pool_id, email):
    """Returns the admin-created (not Google) user with this email, if any."""
    response = cognito.list_users(
        UserPoolId=user_pool_id,
        Filter='email = "{}"'.format(email.replace('"', "")),
    )
    for user in response.get("Users", []):
        if user.get("UserStatus") != "EXTERNAL_PROVIDER":
            return user
    return None

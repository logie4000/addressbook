"""Run with: python -m unittest discover functions/pre_sign_up"""

import os
import unittest
from unittest import mock

os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-1")
import app  # noqa: E402


def google_event(email="ann@example.com", verified="true"):
    return {
        "triggerSource": "PreSignUp_ExternalProvider",
        "userPoolId": "us-east-1_ABC",
        "userName": "google_1234567890",
        "request": {"userAttributes": {"email": email, "email_verified": verified}},
        "response": {},
    }


class PreSignUpTest(unittest.TestCase):
    def setUp(self):
        patcher = mock.patch.object(app, "cognito")
        self.cognito = patcher.start()
        self.addCleanup(patcher.stop)

    def test_links_google_login_to_invited_user(self):
        self.cognito.list_users.return_value = {"Users": [
            {"Username": "google_999", "UserStatus": "EXTERNAL_PROVIDER"},
            {"Username": "abc-uuid", "UserStatus": "CONFIRMED"},
        ]}
        event = google_event(email="Ann@Example.com")

        self.assertIs(app.handler(event, None), event)

        self.cognito.list_users.assert_called_once_with(
            UserPoolId="us-east-1_ABC", Filter='email = "ann@example.com"')
        self.cognito.admin_link_provider_for_user.assert_called_once_with(
            UserPoolId="us-east-1_ABC",
            DestinationUser={"ProviderName": "Cognito", "ProviderAttributeValue": "abc-uuid"},
            SourceUser={"ProviderName": "Google", "ProviderAttributeName": "Cognito_Subject",
                        "ProviderAttributeValue": "1234567890"},
        )

    def test_refuses_uninvited_google_account(self):
        self.cognito.list_users.return_value = {"Users": []}
        with self.assertRaisesRegex(Exception, "not been invited"):
            app.handler(google_event(), None)
        self.cognito.admin_link_provider_for_user.assert_not_called()

    def test_refuses_unverified_email(self):
        with self.assertRaisesRegex(Exception, "not been invited"):
            app.handler(google_event(verified="false"), None)
        self.cognito.list_users.assert_not_called()

    def test_ignores_other_sign_ups(self):
        event = dict(google_event(), triggerSource="PreSignUp_AdminCreateUser")
        self.assertIs(app.handler(event, None), event)
        self.cognito.list_users.assert_not_called()


if __name__ == "__main__":
    unittest.main()

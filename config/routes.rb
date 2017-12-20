Rails.application.routes.draw do
  resources :addresses
  resources :people do
    collection do
      get :add_child_row
    end
  
    member do
      patch :add_child
      patch :remove_child
    end
  end
  
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html

  root to: "addresses#index"  
end

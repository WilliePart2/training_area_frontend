import { Routes } from '@angular/router';
import { IndexLoginComponent } from "./components/login/index.login.component";
import { IndexRegistrationComponent } from "./components/registration/index.registration.component";

export const indexRoutes: Routes = [
    {path: 'login', component: IndexLoginComponent},
    {path: 'registration', component: IndexRegistrationComponent}
];
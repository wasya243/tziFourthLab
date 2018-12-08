import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { AlertService, AuthenticationService } from '../_services';
import { CODES, BLOCK_UI_TIME } from '../constants';

@Component({ templateUrl: 'login.component.html' })
export class LoginComponent implements OnInit {
    loginForm: FormGroup;
    loading = false;
    submitted = false;
    disableLoginButton = false;
    returnUrl: string;

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private authenticationService: AuthenticationService,
        private alertService: AlertService) {
    }

    ngOnInit() {
        this.loginForm = this.formBuilder.group({
            username: [ '', Validators.required ],
            password: [ '', Validators.required ]
        });

        // reset login status
        this.authenticationService.logout();

        // get return url from route parameters or default to '/'
        this.returnUrl = this.route.snapshot.queryParams[ 'returnUrl' ] || '/';
    }

    // convenience getter for easy access to form fields
    get f() {
        return this.loginForm.controls;
    }

    onSubmit() {
        this.submitted = true;

        // stop here if form is invalid
        if (this.loginForm.invalid) {
            return;
        }

        this.loading = true;
        this.authenticationService.login(this.f.username.value, this.f.password.value)
            .pipe(first())
            .subscribe(
                data => {
                    this.router.navigate([ this.returnUrl ]);
                },
                error => {
                    if (error.code === CODES.LIMIT_EXCEEDED) {
                        // disable login button for some time
                        this.disableLoginButton = true;
                        setTimeout(() => {
                            this.disableLoginButton = false;
                        }, BLOCK_UI_TIME);
                    }
                    this.alertService.error(error.message);
                    this.loading = false;
                });
    }
}

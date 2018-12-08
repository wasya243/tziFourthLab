﻿import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { AlertService, UserService, PasswordService } from '../_services';

@Component({ templateUrl: 'register.component.html' })
export class RegisterComponent implements OnInit {
    registerForm: FormGroup;
    loading = false;
    submitted = false;

    constructor(
        private formBuilder: FormBuilder,
        private router: Router,
        private userService: UserService,
        private alertService: AlertService,
        private passwordService: PasswordService
    ) {
    }

    ngOnInit() {
        this.registerForm = this.formBuilder.group({
            firstName: [ '', Validators.required ],
            lastName: [ '', Validators.required ],
            username: [ '', Validators.required ],
            password: [ '', [ Validators.required, Validators.minLength(6) ] ]
        });
    }

    // convenience getter for easy access to form fields
    get f() {
        return this.registerForm.controls;
    }

    generatePassword(): void {
        // generate password for user
        const generatedPassword = this.passwordService.generatePassword();
        this.registerForm.patchValue({ password: generatedPassword });
    }

    onSubmit() {
        this.submitted = true;

        // stop here if form is invalid
        if (this.registerForm.invalid) {
            return;
        }

        this.loading = true;
        this.userService.register(this.registerForm.value)
            .pipe(first())
            .subscribe(
                data => {
                    this.alertService.success('Registration successful', true);
                    this.router.navigate([ '/login' ]);
                },
                error => {
                    this.alertService.error(error);
                    this.loading = false;
                });
    }
}

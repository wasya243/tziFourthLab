import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse, HttpHandler, HttpEvent, HttpInterceptor, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay, mergeMap, materialize, dematerialize } from 'rxjs/operators';

// xor encryption functionality
import { XorEncryption } from '../encryption';
// import key for xor encryption / decryption
import { KEY, ALLOWED_NUMBER_OF_ATTEMPTS, CODES, BLOCK_UI_TIME } from '../constants';

// helper functions & variables
let previousUsername = '';

function findUserByUsername(username: string, users: any): any {
    return users.filter((user: any) => user.username === username)[ 0 ];
}

function updateUser(user: any, users: any): any {
    const remappedUsers = users.map((item: any) => item.username === user.username ? Object.assign(item, user) : item);
    return localStorage.setItem('users', JSON.stringify(remappedUsers));
}

@Injectable()
export class FakeBackendInterceptor implements HttpInterceptor {

    constructor() {
    }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // array in local storage for registered users
        let users: any[] = JSON.parse(localStorage.getItem('users')) || [];
        // wrap in delayed observable to simulate server api call
        return of(null).pipe(mergeMap(() => {

            // authenticate
            if (request.url.endsWith('/users/authenticate') && request.method === 'POST') {
                // get user by current username
                const userByCurrentUserName = findUserByUsername(request.body.username, users);
                if (userByCurrentUserName) {
                    // create instance of xor to encrypt/decrypt values
                    const xor = new XorEncryption(KEY);
                    // crypt password, 'cause we store it in an encrypted form for security reasons
                    const encryptedPassword = xor.encrypt(request.body.password);
                    // check password equality
                    if (userByCurrentUserName.password === encryptedPassword) {
                        // if password is correct
                        const body = {
                            id: userByCurrentUserName.id,
                            username: userByCurrentUserName.username,
                            firstName: userByCurrentUserName.firstName,
                            lastName: userByCurrentUserName.lastName,
                            token: 'fake-jwt-token'
                        };

                        return of(new HttpResponse({ status: 200, body }));
                    } else {
                        // if password is not correct for correct username
                        if (previousUsername === request.body.username) {
                            // if current user exceeded number of attempts, so we would block app from accessing for some time
                            if (userByCurrentUserName.amountOfAttempts > ALLOWED_NUMBER_OF_ATTEMPTS) {
                                userByCurrentUserName.amountOfAttempts = 0;
                                updateUser(userByCurrentUserName, users);
                                return throwError({
                                    status: 401,
                                    error: {
                                        message: `Number of attempts exceeded its allowed limit. Blocking login button for ${BLOCK_UI_TIME} ms`,
                                        code: CODES.LIMIT_EXCEEDED
                                    }
                                });
                            } else {
                                // if number of attempts is not exceeded, we should warn user about wrong password
                                userByCurrentUserName.amountOfAttempts += 1;
                                updateUser(userByCurrentUserName, users);
                                return throwError({
                                    status: 401,
                                    error: {
                                        message: 'Invalid password',
                                        code: CODES.INVALID_PASSWORD
                                    }
                                });
                            }
                        } else {
                            // if username is different from previously entered one
                            const userByPreviousUsername = findUserByUsername(previousUsername, users);
                            // update only if previous user exists
                            userByPreviousUsername && (userByPreviousUsername.amountOfAttempts = 0);
                            userByPreviousUsername && updateUser(userByPreviousUsername, users);
                            userByCurrentUserName.amountOfAttempts += 1;
                            updateUser(userByCurrentUserName, users);
                            previousUsername = request.body.username;
                            return throwError({ status: 401, error: { message: 'Invalid password', code: CODES.INVALID_PASSWORD } });
                        }
                    }
                } else {
                    return throwError({ status: 401, error: { message: 'Username does not exist in the system' } });
                }
            }

            // get users
            if (request.url.endsWith('/users') && request.method === 'GET') {
                // check for fake auth token in header and return users if valid, this security is implemented server side in a real application
                if (request.headers.get('Authorization') === 'Bearer fake-jwt-token') {
                    return of(new HttpResponse({ status: 200, body: users }));
                } else {
                    // return 401 not authorised if token is null or invalid
                    return throwError({ status: 401, error: { message: 'Unauthorised' } });
                }
            }

            // get user by id
            if (request.url.match(/\/users\/\d+$/) && request.method === 'GET') {
                // check for fake auth token in header and return user if valid, this security is implemented server side in a real application
                if (request.headers.get('Authorization') === 'Bearer fake-jwt-token') {
                    // find user by id in users array
                    let urlParts = request.url.split('/');
                    let id = parseInt(urlParts[ urlParts.length - 1 ]);
                    let matchedUsers = users.filter(user => {
                        return user.id === id;
                    });
                    let user = matchedUsers.length ? matchedUsers[ 0 ] : null;

                    return of(new HttpResponse({ status: 200, body: user }));
                } else {
                    // return 401 not authorised if token is null or invalid
                    return throwError({ status: 401, error: { message: 'Unauthorised' } });
                }
            }

            // register user
            if (request.url.endsWith('/users/register') && request.method === 'POST') {
                // get new user object from post body
                let newUser = request.body;

                // validation
                let duplicateUser = users.filter(user => {
                    return user.username === newUser.username;
                }).length;
                if (duplicateUser) {
                    return throwError({ error: { message: 'Username "' + newUser.username + '" is already taken' } });
                }

                // save new user & encrypt password using XOR encryption
                const xor = new XorEncryption(KEY);
                newUser.id = users.length + 1;
                newUser.password = xor.encrypt(newUser.password);
                newUser.amountOfAttempts = 0;
                users.push(newUser);
                localStorage.setItem('users', JSON.stringify(users));

                // respond 200 OK
                return of(new HttpResponse({ status: 200 }));
            }

            // delete user
            if (request.url.match(/\/users\/\d+$/) && request.method === 'DELETE') {
                // check for fake auth token in header and return user if valid, this security is implemented server side in a real application
                if (request.headers.get('Authorization') === 'Bearer fake-jwt-token') {
                    // find user by id in users array
                    let urlParts = request.url.split('/');
                    let id = parseInt(urlParts[ urlParts.length - 1 ]);
                    for (let i = 0; i < users.length; i++) {
                        let user = users[ i ];
                        if (user.id === id) {
                            // delete user
                            users.splice(i, 1);
                            localStorage.setItem('users', JSON.stringify(users));
                            break;
                        }
                    }

                    // respond 200 OK
                    return of(new HttpResponse({ status: 200 }));
                } else {
                    // return 401 not authorised if token is null or invalid
                    return throwError({ status: 401, error: { message: 'Unauthorised' } });
                }
            }

            // pass through any requests not handled above
            return next.handle(request);

        }))

        // call materialize and dematerialize to ensure delay even if an error is thrown (https://github.com/Reactive-Extensions/RxJS/issues/648)
            .pipe(materialize())
            .pipe(delay(500))
            .pipe(dematerialize());
    }
}

export let fakeBackendProvider = {
    // use fake backend in place of Http service for backend-less development
    provide: HTTP_INTERCEPTORS,
    useClass: FakeBackendInterceptor,
    multi: true
};

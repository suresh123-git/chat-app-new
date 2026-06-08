import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastService } from './toast.service';

@Injectable()
export class GlobalHttpErrorInterceptor implements HttpInterceptor {
  constructor(private toastService: ToastService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let message = 'Something went wrong. Please try again.';

        if (error.error?.message) {
          message = error.error.message;
        } else if (typeof error.error === 'string') {
          message = error.error;
        } else if (error.status === 0) {
          message = 'Unable to connect to server. Check your internet connection.';
        } else if (error.status === 400) {
          message = 'Bad request. Please check your input.';
        } else if (error.status === 401) {
          message = 'Session expired. Please log in again.';
        } else if (error.status === 403) {
          message = 'You do not have permission to perform this action.';
        } else if (error.status === 404) {
          message = 'Resource not found.';
        } else if (error.status >= 500) {
          message = 'Server error. Please try again later.';
        }

        this.toastService.error(message);
        return throwError(() => error);
      }),
    );
  }
}

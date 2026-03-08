import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // Временно ставим true (пользователь "авторизован").
  // Позже мы привяжем это к реальной логике авторизации.
  const isAuthenticated = true;

  if (isAuthenticated) {
    return true;
  } else {
    router.navigate(['/home']);
    return false;
  }
};

import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { LanguageService } from '../../core/services/language.service';
import { UserRole } from '../../shared/models/content';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';

interface RoleCard {
  id: UserRole;
  title: string;
  desc: string;
}

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
})
export class AuthPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthService);
  private readonly profile = inject(ProfileService);
  readonly lang = inject(LanguageService);

  readonly isRegisterMode = signal(this.route.routeConfig?.path === 'register');
  readonly title = computed(() => (this.isRegisterMode() ? this.lang.t('auth_register_title') : this.lang.t('auth_login_title')));
  readonly submitLabel = computed(() => (this.isRegisterMode() ? this.lang.t('create_account') : this.lang.t('sign_in')));
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly avatarMap: Record<UserRole, string[]> = {
    student: ['👨', '👩'],
    teacher: ['👨', '👩'],
  };

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['student' as UserRole],
    avatar: ['👨'],
  });

  constructor() {
    if (!this.isRegisterMode()) {
      this.form.controls.name.removeValidators([Validators.required, Validators.minLength(2)]);
      this.form.controls.name.updateValueAndValidity({ emitEvent: false });
    }

    this.form.controls.role.valueChanges.subscribe((role) => {
      const chosenRole = role ?? 'student';
      const avatars = this.avatarMap[chosenRole];
      if (!avatars.includes(this.form.controls.avatar.value)) {
        this.form.controls.avatar.setValue(avatars[0], { emitEvent: false });
      }
    });
  }

  avatarChoices(): string[] {
    return this.avatarMap[this.form.controls.role.value];
  }

  roleCards(): RoleCard[] {
    return [
      { id: 'student', title: this.lang.t('role_student'), desc: this.lang.t('role_student_desc') },
      { id: 'teacher', title: this.lang.t('role_teacher'), desc: this.lang.t('role_teacher_desc') },
    ];
  }

  async submit(): Promise<void> {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, email, password, role, avatar } = this.form.getRawValue();

    try {
      if (this.isRegisterMode()) {
        await this.auth.register({ name, email, password, role, avatar });
        this.successMessage.set(this.lang.t('account_created'));
      } else {
        await this.auth.login({ email, password });
        this.successMessage.set(this.lang.t('signed_in'));
      }

      await this.profile.refresh(true);
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/profile';
      await this.router.navigateByUrl(returnUrl);
    } catch (error) {
      this.errorMessage.set(error instanceof Error ? error.message : this.lang.t('request_failed'));
    }
  }
}

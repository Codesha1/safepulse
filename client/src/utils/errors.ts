import { ApiError } from '../services/api';

/** Maps any thrown error to a translation key. */
export function errorKey(e: unknown, ctx?: 'login' | 'upload' | 'analyze'): string {
  if (e instanceof ApiError) {
    switch (e.code) {
      case 'INVALID_CREDENTIALS': return ctx === 'login' ? 'errors.login' : 'errors.currentPassword';
      case 'NETWORK': return 'errors.network';
      case 'AI_UNAVAILABLE': return 'errors.ai';
      case 'UPLOAD_FAILED': return 'errors.upload';
      case 'NO_FOOD': return 'errors.noFood';
      case 'TOO_MANY_REQUESTS': return 'errors.tooMany';
      case 'STUDENT_CODE_EXISTS': return 'errors.studentCodeExists';
      case 'EMAIL_IN_USE': return 'errors.emailInUse';
      case 'WEAK_PASSWORD': return 'errors.weakPassword';
      case 'INVALID_TOKEN': return 'errors.invalidToken';
      case 'DEMO_LOCKED': return 'errors.demoLocked';
      case 'FORBIDDEN': return 'errors.forbidden';
      case 'VALIDATION': return 'errors.validation';
      default: break;
    }
  }
  return 'errors.generic';
}

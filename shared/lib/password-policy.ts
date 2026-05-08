import "server-only"

const MIN_PASSWORD_LENGTH = 12

export function validatePasswordStrength(password: string) {
  const errors: string[] = []

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`)
  }

  if (!/[a-z]/.test(password)) {
    errors.push("La contraseña debe incluir al menos una letra minúscula")
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("La contraseña debe incluir al menos una letra mayúscula")
  }

  if (!/[0-9]/.test(password)) {
    errors.push("La contraseña debe incluir al menos un número")
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("La contraseña debe incluir al menos un carácter especial")
  }

  if (/\s/.test(password)) {
    errors.push("La contraseña no debe contener espacios")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

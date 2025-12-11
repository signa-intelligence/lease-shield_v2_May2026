/**
 * Form Validation Utilities
 * Reusable validation functions for common form fields
 */

export const validators = {
  required: (value, fieldName = 'This field') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return null;
  },

  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  phone: (value) => {
    if (!value) return null;
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(value) || value.replace(/\D/g, '').length < 9) {
      return 'Please enter a valid phone number';
    }
    return null;
  },

  minLength: (value, min, fieldName = 'This field') => {
    if (!value) return null;
    if (value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (value, max, fieldName = 'This field') => {
    if (!value) return null;
    if (value.length > max) {
      return `${fieldName} must not exceed ${max} characters`;
    }
    return null;
  },

  number: (value, fieldName = 'This field') => {
    if (!value) return null;
    if (isNaN(value) || isNaN(parseFloat(value))) {
      return `${fieldName} must be a valid number`;
    }
    return null;
  },

  positiveNumber: (value, fieldName = 'This field') => {
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return `${fieldName} must be a positive number`;
    }
    return null;
  },

  date: (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Please enter a valid date';
    }
    return null;
  },

  futureDate: (value, fieldName = 'Date') => {
    if (!value) return null;
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return `${fieldName} must be in the future`;
    }
    return null;
  },

  pastDate: (value, fieldName = 'Date') => {
    if (!value) return null;
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date > today) {
      return `${fieldName} must be in the past`;
    }
    return null;
  },

  url: (value) => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  }
};

/**
 * Validate a form object against a validation schema
 * @param {Object} formData - Form data object
 * @param {Object} schema - Validation schema
 * @returns {Object} - Errors object
 * 
 * Example:
 * const schema = {
 *   email: [(v) => validators.required(v, 'Email'), validators.email],
 *   phone: [validators.phone],
 *   amount: [(v) => validators.positiveNumber(v, 'Amount')]
 * };
 * const errors = validateForm(formData, schema);
 */
export function validateForm(formData, schema) {
  const errors = {};
  
  for (const [field, validatorFns] of Object.entries(schema)) {
    const value = formData[field];
    
    for (const validatorFn of validatorFns) {
      const error = validatorFn(value);
      if (error) {
        errors[field] = error;
        break; // Stop at first error for this field
      }
    }
  }
  
  return errors;
}

/**
 * Check if form has any errors
 */
export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

/**
 * Custom hook for form validation
 */
import { useState, useCallback } from 'react';

export function useFormValidation(initialValues, validationSchema) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const handleBlur = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate this field on blur
    if (validationSchema[field]) {
      const value = values[field];
      for (const validatorFn of validationSchema[field]) {
        const error = validatorFn(value);
        if (error) {
          setErrors(prev => ({ ...prev, [field]: error }));
          break;
        }
      }
    }
  }, [validationSchema, values]);

  const validate = useCallback(() => {
    const newErrors = validateForm(values, validationSchema);
    setErrors(newErrors);
    return !hasErrors(newErrors);
  }, [values, validationSchema]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
    reset,
    setValues,
    setErrors
  };
}
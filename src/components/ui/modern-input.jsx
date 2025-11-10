import React from "react";

/**
 * Modern Input Component with consistent styling
 * Features: Better focus states, icons, error handling
 */
export function ModernInput({ 
  type = 'text',
  value,
  onChange,
  placeholder,
  label,
  error,
  icon,
  disabled = false,
  required = false,
  isDark = false,
  className = '',
  ...props
}) {
  const [isFocused, setIsFocused] = React.useState(false);

  const labelStyles = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '8px',
    color: isDark ? '#ECEFED' : '#1A1D1F'
  };

  const inputWrapperStyles = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  };

  const inputStyles = {
    width: '100%',
    padding: icon ? '12px 16px 12px 44px' : '12px 16px',
    fontSize: '16px',
    fontFamily: 'inherit',
    backgroundColor: isDark ? '#353A3D' : '#FFFFFF',
    color: isDark ? '#ECEFED' : '#1A1D1F',
    border: `2px solid ${
      error ? '#EF4444' : 
      isFocused ? '#0C3B2E' : 
      isDark ? '#3A3D40' : '#E5E7EB'
    }`,
    borderRadius: '12px',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
    boxShadow: isFocused ? '0 0 0 3px rgba(12, 59, 46, 0.1)' : 'none',
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'text'
  };

  const iconStyles = {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: isDark ? '#9CA3AF' : '#6B7280',
    pointerEvents: 'none'
  };

  const errorStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '6px',
    fontSize: '13px',
    color: '#EF4444'
  };

  return (
    <div className={className}>
      {label && (
        <label style={labelStyles}>
          {label}
          {required && <span style={{ color: '#EF4444', marginLeft: '4px' }}>*</span>}
        </label>
      )}
      <div style={inputWrapperStyles}>
        {icon && <div style={iconStyles}>{icon}</div>}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          style={inputStyles}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </div>
      {error && (
        <div style={errorStyles}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}

export function ModernTextarea({ 
  value,
  onChange,
  placeholder,
  label,
  error,
  disabled = false,
  required = false,
  isDark = false,
  rows = 4,
  className = '',
  ...props
}) {
  const [isFocused, setIsFocused] = React.useState(false);

  const labelStyles = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '8px',
    color: isDark ? '#ECEFED' : '#1A1D1F'
  };

  const textareaStyles = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    fontFamily: 'inherit',
    backgroundColor: isDark ? '#353A3D' : '#FFFFFF',
    color: isDark ? '#ECEFED' : '#1A1D1F',
    border: `2px solid ${
      error ? '#EF4444' : 
      isFocused ? '#0C3B2E' : 
      isDark ? '#3A3D40' : '#E5E7EB'
    }`,
    borderRadius: '12px',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
    boxShadow: isFocused ? '0 0 0 3px rgba(12, 59, 46, 0.1)' : 'none',
    resize: 'vertical',
    minHeight: `${rows * 24}px`,
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'text'
  };

  const errorStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '6px',
    fontSize: '13px',
    color: '#EF4444'
  };

  return (
    <div className={className}>
      {label && (
        <label style={labelStyles}>
          {label}
          {required && <span style={{ color: '#EF4444', marginLeft: '4px' }}>*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        style={textareaStyles}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {error && (
        <div style={errorStyles}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
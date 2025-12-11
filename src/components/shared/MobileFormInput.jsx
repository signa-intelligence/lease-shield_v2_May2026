import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

/**
 * Mobile-optimized form input with proper keyboard handling
 * Automatically adjusts input type and attributes for mobile
 */
export default function MobileFormInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  multiline = false,
  rows = 3,
  icon: Icon,
  colors,
  autoFocus = false,
  inputMode, // auto, numeric, decimal, tel, email, url
  pattern,
  min,
  max,
  step,
  disabled = false,
  hint
}) {
  const inputId = `input-${label?.replace(/\s/g, '-').toLowerCase()}`;

  // Auto-detect inputMode based on type if not specified
  const getInputMode = () => {
    if (inputMode) return inputMode;
    
    switch(type) {
      case 'number': return 'numeric';
      case 'tel': return 'tel';
      case 'email': return 'email';
      case 'url': return 'url';
      default: return 'text';
    }
  };

  const commonProps = {
    id: inputId,
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    required: required,
    autoFocus: autoFocus,
    disabled: disabled,
    inputMode: getInputMode(),
    style: {
      backgroundColor: colors?.fieldBg || colors?.inputBg || (colors?.cardBg || '#FFFFFF'),
      borderColor: error ? '#EF4444' : (colors?.borderColor || '#E5E7EB'),
      color: colors?.textPrimary || '#0F172A',
      fontSize: '16px', // Prevents zoom on iOS
      minHeight: '48px', // Touch target minimum (increased from 44px)
      padding: '12px 16px',
      borderRadius: '12px',
      transition: 'all 0.2s ease',
    },
    className: `${error ? 'border-2 border-red-500 focus:border-red-500' : 'border-2 focus:border-ls-forest'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`
  };

  const numberProps = type === 'number' ? {
    min: min,
    max: max,
    step: step,
    pattern: pattern
  } : {};

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={inputId} className="flex items-center gap-2" style={{ 
          color: colors?.textPrimary || '#0F172A',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          {Icon && <Icon className="w-4 h-4" style={{ color: colors?.textSecondary || '#64748B' }} />}
          <span>{label}</span>
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </Label>
      )}
      
      <div className="relative">
        {multiline ? (
          <Textarea
            {...commonProps}
            rows={rows}
            style={{
              ...commonProps.style,
              minHeight: '96px', // 2x touch target for textarea
              resize: 'vertical',
              lineHeight: '1.5'
            }}
          />
        ) : (
          <Input
            type={type}
            {...commonProps}
            {...numberProps}
          />
        )}
        
        {error && (
          <p className="text-xs text-red-500 mt-1 font-medium">
            {error}
          </p>
        )}
        
        {hint && !error && (
          <p className="text-xs mt-1" style={{ 
            color: colors?.textSecondary || '#64748B',
            lineHeight: '1.4'
          }}>
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
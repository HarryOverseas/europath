import React from 'react';
import { ChevronDown } from 'lucide-react';
import {
  COUNTRY_PHONE_CONFIGS,
  CountryPhoneConfig
} from '../utils/countryData';

export interface InternationalPhoneInputProps {
  id?: string;
  name?: string;
  label?: string;
  required?: boolean;
  country: CountryPhoneConfig;
  onCountryChange: (country: CountryPhoneConfig) => void;
  value: string; // National digits or formatted string
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const InternationalPhoneInput: React.FC<InternationalPhoneInputProps> = ({
  id,
  name,
  label,
  required = false,
  country,
  onCountryChange,
  value,
  onChange,
  error,
  placeholder,
  disabled = false,
  className = '',
  size = 'md'
}) => {
  const isSmall = size === 'sm';

  const handleSelectCountry = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIso = e.target.value;
    const found = COUNTRY_PHONE_CONFIGS.find(c => c.code === selectedIso);
    if (found) {
      onCountryChange(found);
    }
  };

  const handleDigitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Keep numbers and spacing, strip non-numeric symbols
    const inputVal = e.target.value;
    onChange(inputVal);
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className={`block font-semibold text-slate-700 mb-1 ${
            isSmall ? 'text-[11px]' : 'text-xs'
          }`}
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div
        className={`flex items-center rounded-xl border bg-white transition-all overflow-hidden ${
          error
            ? 'border-rose-400 ring-2 ring-rose-100 bg-rose-50/20'
            : 'border-slate-300 focus-within:border-brand-gold focus-within:ring-2 focus-within:ring-brand-gold/20'
        } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
      >
        {/* Country Selector Dropdown */}
        <div className="relative flex items-center bg-slate-50 border-r border-slate-200 hover:bg-slate-100 transition shrink-0">
          <div
            className={`flex items-center space-x-1.5 pl-3 pr-2.5 cursor-pointer pointer-events-none ${
              isSmall ? 'py-1.5 text-xs' : 'py-2.5 text-sm'
            }`}
          >
            <span className="text-base leading-none select-none" aria-hidden="true">
              {country.flag}
            </span>
            <span className="font-semibold text-slate-700 font-mono text-xs">
              {country.dialCode}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <select
            value={country.code}
            onChange={handleSelectCountry}
            disabled={disabled}
            aria-label="Select Country Calling Code"
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
          >
            {COUNTRY_PHONE_CONFIGS.map(c => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name} ({c.dialCode})
              </option>
            ))}
          </select>
        </div>

        {/* National Number Input */}
        <input
          id={id}
          name={name}
          type="tel"
          inputMode="tel"
          required={required}
          disabled={disabled}
          value={value}
          onChange={handleDigitChange}
          placeholder={placeholder || country.placeholder}
          className={`w-full bg-transparent focus:outline-none text-slate-900 placeholder-slate-400 ${
            isSmall ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2.5 text-sm'
          }`}
        />
      </div>

      {error && (
        <p className="text-rose-600 text-xs mt-1 flex items-center space-x-1 animate-fadeIn">
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

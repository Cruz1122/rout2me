import { useRef, useEffect } from 'react';

interface R2MCodeInputProps {
  readonly length: number;
  readonly value: string[];
  readonly onChange: (value: string[]) => void;
  readonly type?: 'numeric' | 'alphanumeric';
  readonly autoFocus?: boolean;
}

export default function R2MCodeInput({
  length,
  value,
  onChange,
  type = 'numeric',
  autoFocus = false,
}: R2MCodeInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus]);

  const filterInput = (input: string): string => {
    if (type === 'numeric') {
      return input.replaceAll(/\D/g, '');
    }
    return input.replaceAll(/[^A-Za-z0-9]/g, '').toUpperCase();
  };

  const handleCodeChange = (index: number, inputValue: string) => {
    const filteredValue = filterInput(inputValue);

    if (filteredValue.length > 1) {
      handlePaste(filteredValue);
    } else {
      handleSingleChar(index, filteredValue);
    }
  };

  const handlePaste = (pastedValue: string) => {
    const pastedCode = pastedValue.slice(0, length).split('');
    const newCode = [...value];

    for (const [i, char] of pastedCode.entries()) {
      if (i < length) {
        newCode[i] = char;
      }
    }
    onChange(newCode);

    const lastFilledIndex = newCode.findIndex((char, i) => !char && i > 0);
    const nextIndex =
      lastFilledIndex === -1
        ? Math.min(length - 1, pastedCode.length - 1)
        : lastFilledIndex;
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSingleChar = (index: number, char: string) => {
    const newCode = [...value];
    newCode[index] = char;
    onChange(newCode);

    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      // Si el input actual está vacío y se presiona backspace, ir al anterior
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {value.map((char, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode={type === 'numeric' ? 'numeric' : 'text'}
          pattern={type === 'numeric' ? '[0-9]*' : undefined}
          maxLength={length}
          value={char}
          onChange={(e) => handleCodeChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className="w-12 h-12 text-center text-xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          style={{
            borderColor: char ? 'var(--color-primary)' : 'var(--color-surface)',
            backgroundColor: char ? 'var(--color-bg)' : 'white',
            color: 'var(--color-text)',
          }}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
}

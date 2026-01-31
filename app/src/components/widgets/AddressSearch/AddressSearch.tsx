'use client';

import React, { useState, useCallback, forwardRef } from 'react';
import DaumPostcodeEmbed, { Address } from 'react-daum-postcode';
import Modal from '@/components/Modal/Modal';
import { cn } from '@/lib/utils';

interface AddressSearchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'readOnly'> {
  value?: string;
  disabled?: boolean;
  onSearch?: (address: string, zonecode?: string) => void;
  showButton?: boolean; // 기본값 true. false면 버튼 숨김(입력 클릭으로만 열기)
}

const generateExtraAddress = (data: Address) => {
  let extraAddress = '';
  if (data.bname !== '') {
    extraAddress += data.bname;
  }
  if (data.buildingName !== '') {
    extraAddress += extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName;
  }
  return extraAddress;
};

export const AddressSearch = forwardRef<HTMLInputElement, AddressSearchProps>(
  ({ className, disabled, onSearch, onChange, showButton = true, ...formControlProps }, ref) => {
    const [showAddressPopup, setShowAddressPopup] = useState(false);
    const [openQuery, setOpenQuery] = useState<string | undefined>(undefined);

    const sanitizeToQuery = (raw?: unknown): string | undefined => {
      if (typeof raw !== 'string') return undefined;
      const trimmed = raw.trim();
      if (!trimmed) return undefined;
      // 1) 괄호 내용 제거  2) 콤마(,) 이후 상세 제거  3) 공백 정리
      const noParen = trimmed.replace(/\([^)]*\)/g, '').trim();
      const firstPart = noParen.split(',')[0]?.trim() ?? '';
      return firstPart || undefined;
    };

    const handleComplete = useCallback(
      (data: Address) => {
        const extraAddress = generateExtraAddress(data);
        const formattedAddress = `${data.address} ${extraAddress ? `(${extraAddress})` : ''}`;

        // ref가 있으면 값 설정
        if (ref && 'current' in ref && ref.current) {
          ref.current.value = formattedAddress;
          const changeEvent = new Event('change', { bubbles: true });
          ref.current.dispatchEvent(changeEvent);
        }

        // onChange 콜백 실행
        if (onChange && typeof onChange === 'function') {
          const event = new Event('change', { bubbles: true }) as unknown as React.ChangeEvent<HTMLInputElement>;
          Object.defineProperty(event, 'target', { value: { value: formattedAddress } });
          onChange(event);
        }

        // onSearch 콜백 실행 (우편번호 포함)
        onSearch?.(formattedAddress, data.zonecode);
        setShowAddressPopup(false);
      },
      [onSearch, onChange, ref]
    );

    const handleOpen = useCallback(() => {
      setOpenQuery(sanitizeToQuery(formControlProps.value));
      setShowAddressPopup(true);
    }, [formControlProps]);
    const handleClose = useCallback(() => setShowAddressPopup(false), []);

    return (
      <div className="inline-flex items-stretch w-full">
        <input
          ref={ref}
          className={cn(
            "flex-1 px-3 border border-gray-300 focus:outline-none focus:border-blue-500",
            showButton ? "rounded-l" : "rounded-lg",
            "bg-white text-gray-900 placeholder-gray-500",
            "disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed",
            "h-[38px]", // plain input 기본 높이
            className
          )}
          readOnly
          disabled={disabled}
          {...formControlProps}
          onClick={handleOpen}
        />
        {showButton && (
          <button
            type="button"
            disabled={disabled}
            onClick={handleOpen}
            className="ml-2 rounded-l-none h-[38px] px-3 text-sm font-medium text-white bg-[#0a3b41] hover:bg-[#062429] disabled:bg-gray-100 disabled:text-gray-300 transition-colors rounded-r-lg"
          >
            주소 검색
          </button>
        )}
        <Modal
          isOpen={showAddressPopup}
          title="주소 검색"
          showCancelButton={false}
          showCloseButton={true}
          showButtons={false}
          onClose={handleClose}
        >
          <DaumPostcodeEmbed
            onComplete={handleComplete}
            onClose={handleClose}
            // 모달 열기 시점에 캡처한 현재 주소를 기본 검색어로 전달
            defaultQuery={openQuery}
          />
        </Modal>
      </div>
    );
  }
);

AddressSearch.displayName = 'AddressSearch';

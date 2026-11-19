import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ModernConfirmModal } from '../components/ModernConfirmModal';

describe('ModernConfirmModal Component', () => {
  it('renders sign out confirmation with title, badge, and buttons', () => {
    const handleClose = jest.fn();
    const handleConfirm = jest.fn();

    const { getByText } = render(
      <ModernConfirmModal
        visible={true}
        title="Sign Out?"
        subtitle="Are you sure you want to sign out of PetFriendly?"
        badge="SECURITY & SESSION"
        type="logout"
        confirmText="Yes, Sign Out"
        cancelText="Stay Logged In"
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
    );

    expect(getByText('Sign Out?')).toBeTruthy();
    expect(getByText('SECURITY & SESSION')).toBeTruthy();
    expect(getByText('Are you sure you want to sign out of PetFriendly?')).toBeTruthy();
    expect(getByText('Stay Logged In')).toBeTruthy();
    expect(getByText('Yes, Sign Out')).toBeTruthy();
  });

  it('calls onConfirm when confirm button is pressed', () => {
    const handleClose = jest.fn();
    const handleConfirm = jest.fn();

    const { getByText } = render(
      <ModernConfirmModal
        visible={true}
        title="Sign Out?"
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
    );

    const confirmBtn = getByText('Sign Out');
    fireEvent.press(confirmBtn);

    expect(handleConfirm).toHaveBeenCalledTimes(1);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is pressed', () => {
    const handleClose = jest.fn();
    const handleConfirm = jest.fn();

    const { getByText } = render(
      <ModernConfirmModal
        visible={true}
        title="Sign Out?"
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
    );

    const cancelBtn = getByText('Cancel');
    fireEvent.press(cancelBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(handleConfirm).not.toHaveBeenCalled();
  });

  it('renders single button mode for info / success alerts', () => {
    const handleClose = jest.fn();

    const { getByText, queryByText } = render(
      <ModernConfirmModal
        visible={true}
        title="Pawsport Activated! 🎉"
        subtitle="Simba is now registered!"
        badge="PACK PASSPORT"
        type="success"
        confirmText="Awesome!"
        singleButton={true}
        onClose={handleClose}
      />
    );

    expect(getByText('Pawsport Activated! 🎉')).toBeTruthy();
    expect(getByText('Awesome!')).toBeTruthy();
    expect(queryByText('Cancel')).toBeNull();
  });

  it('renders close button when showCloseButton is true and calls onClose when pressed', () => {
    const handleClose = jest.fn();

    const { getByTestId } = render(
      <ModernConfirmModal
        visible={true}
        title="Sign Out?"
        showCloseButton={true}
        onClose={handleClose}
      />
    );

    const closeBtn = getByTestId('modern-confirm-close-btn');
    expect(closeBtn).toBeTruthy();
    fireEvent.press(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

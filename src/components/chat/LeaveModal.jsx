import { Button } from '@chakra-ui/react';
import React from 'react';

const LeaveModal = ({ isOpen, onCancel, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="leave-modal-overlay" role="dialog" aria-modal="true">
            <div className="leave-modal">
                <div className="leave-modal-header">
                    <h3>Leave workspace?</h3>
                </div>
                <div className="leave-modal-body">
                    <p>You're about to navigate away. Your progress won't be saved.</p>
                </div>
                <div className="leave-modal-footer">
                    <Button
                        onClick={onCancel}
                        size="sm"
                        variant="outline"
                        colorScheme="gray"
                        className="leave-modal-button"
                    >
                        Stay
                    </Button>
                    <Button
                        onClick={onConfirm}
                        size="sm"
                        colorScheme="cyan"
                        className="leave-modal-button"
                    >
                        Leave
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default LeaveModal;

import React from 'react';
import { useActiveWalletAccount } from '@deriv/api';
import { TradingAccountCard, WalletButton } from '../../../../../components';
import { useModal } from '../../../../../components/ModalProvider';
import { getStaticUrl } from '../../../../../helpers/urls';
import { THooks } from '../../../../../types';
import { MarketTypeToDescriptionMapper, MarketTypeToIconMapper, MarketTypeToTitleMapper } from '../../../constants';
import { JurisdictionModal, MT5PasswordModal } from '../../../modals';
import './AvailableMT5AccountsList.scss';

type TProps = {
    account: THooks.SortedMT5Accounts;
};

const MT5AccountIcon: React.FC<TProps> = ({ account }) => {
    const IconToLink = () => {
        switch (account.market_type) {
            case 'financial':
            case 'synthetic':
            case 'all':
                return window.open(getStaticUrl('/dmt5'));
            default:
                return window.open(getStaticUrl('/dmt5'));
        }
    };
    return (
        <div className='wallets-available-mt5__icon' onClick={() => IconToLink()}>
            {MarketTypeToIconMapper[account.market_type || 'all']}
        </div>
    );
};

const AvailableMT5AccountsList: React.FC<TProps> = ({ account }) => {
    const { data: activeWallet } = useActiveWalletAccount();
    const { setModalState, show } = useModal();

    return (
        <TradingAccountCard
            leading={() => <MT5AccountIcon account={account} />}
            trailing={() => (
                <WalletButton
                    color='primary-light'
                    onClick={() => {
                        setModalState({
                            marketType: account.market_type,
                        });
                        show(
                            activeWallet?.is_virtual ? (
                                <MT5PasswordModal
                                    marketType={account?.market_type || 'synthetic'}
                                    platform={account.platform}
                                />
                            ) : (
                                <JurisdictionModal />
                            )
                        );
                    }}
                    text='Get'
                />
            )}
        >
            <div className='wallets-available-mt5__details'>
                <p className='wallets-available-mt5__details-title'>
                    {MarketTypeToTitleMapper[account.market_type || 'all']}
                </p>
                <p className='wallets-available-mt5__details-description'>
                    {MarketTypeToDescriptionMapper[account.market_type || 'all']}
                </p>
            </div>
        </TradingAccountCard>
    );
};

export default AvailableMT5AccountsList;

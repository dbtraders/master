import { localize } from '@deriv/translations';

export type TSidebarItem = {
    label: string;
    content: { data: string; faq_id?: string }[];
    link: boolean;
};

export const SIDEBAR_INTRO: TSidebarItem[] = [
    {
        label: localize('RISK DISCLAIMER!!!'),
        content: [
            {
                data: localize(
                    'Deriv offers complex derivatives, such as options and contracts for difference (“CFDs”). These products may not be suitable for all clients, and trading them puts you at risk.'
                ),
            },
            { data: localize('Please make sure that you understand the following risks before trading Deriv products') },
            { data: localize('a) you may lose some or all of the money you invest in the trade') },
            { data: localize('b) if your trade involves currency conversion, exchange rates will affect your profit and loss. You should never trade with borrowed money or with money that you cannot afford to lose.') },
        ],
        link: false,
    },
    {
        label: localize('Welcome to DBtraders Bot!'),
        content: [
            {
                data: localize(
                    'Ready to automate your trading strategy without writing any code? You’ve come to the right place.'
                ),
            },
            { data: localize('Check out these guides and FAQs to learn more about building your bot:') },
        ],
        link: false,
    },
    {
        label: localize('Guide'),
        content: [{ data: localize('DBtraders Bot - your automated trading partner') }],
        link: true,
    },
    {
        label: localize('FAQs'),
        content: [
            {
                data: localize('What is DBtraders Bot?'),
                faq_id: 'faq-0',
            },
            {
                data: localize('Where do I find the blocks I need?'),
                faq_id: 'faq-1',
            },
            {
                data: localize('How do I remove blocks from the workspace?'),
                faq_id: 'faq-2',
            },
        ],
        link: true,
    },
];

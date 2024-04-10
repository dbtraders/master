import { formatTime, findValueByKeyRecursively, getRoundedNumber, isEmptyObject } from '@deriv/shared';
import { localize } from '@deriv/translations';
import { error as logError } from './broadcast';
import { observer as globalObserver } from '../../../utils/observer';
import { config } from '../../../constants/config';
import { getToken } from '../../api/appId';

export const tradeOptionToProposal = (trade_option, purchase_reference) =>
    trade_option.contractTypes.map(type => {
        const proposal = {
            amount: trade_option.amount,
            basis: trade_option.basis,
            contract_type: type,
            currency: trade_option.currency,
            duration: trade_option.duration,
            duration_unit: trade_option.duration_unit,
            multiplier: trade_option.multiplier,
            passthrough: {
                contract_type: type,
                purchase_reference,
            },
            proposal: 1,
            symbol: trade_option.symbol,
        };
        if (trade_option.prediction !== undefined) {
            proposal.selected_tick = trade_option.prediction;
        }
        if (!['TICKLOW', 'TICKHIGH'].includes(type) && trade_option.prediction !== undefined) {
            proposal.barrier = trade_option.prediction;
        } else if (trade_option.barrierOffset !== undefined) {
            proposal.barrier = trade_option.barrierOffset;
        }
        if (trade_option.secondBarrierOffset !== undefined) {
            proposal.barrier2 = trade_option.secondBarrierOffset;
        }
        if (['MULTUP', 'MULTDOWN'].includes(type)) {
            proposal.duration = undefined;
            proposal.duration_unit = undefined;
        }
        if (!isEmptyObject(trade_option.limit_order)) {
            proposal.limit_order = trade_option.limit_order;
        }
        return proposal;
    });

// Added Custom contract amount function
const getStakeAmount = trade_option => {
    if (config.vh_variables.is_martingale_active) {
        return config.vh_variables.mart_stake;
    } else if (config.vh_variables.is_enabled) {
        return config.vh_variables.stake;
    } else {
        return trade_option.amount;
    }
};

const unwantedContracts = [
    'DIGITEVEN',
    'DIGITODD',
    'CALL',
    'PUT',
    'CALLE',
    'PUTE',
    'RUNHIGH',
    'RUNLOW',
    'RESETCALL',
    'RESETPUT',
    'TICKHIGH',
    'TICKLOW',
];

export const tradeOptionToBuy = (contract_type, trade_option) => {
    let cp_tokens = localStorage.getItem(`${getToken().account_id}_tokens`);
    cp_tokens = JSON.parse(cp_tokens);
    const vh_active = config.vh_variables.is_enabled;

    const buy = !config.copy_trading.is_active
        ? vh_active
            ? {
                  buy: '1',
                  subscribe: 1,
                  price: getStakeAmount(trade_option),
                  parameters: {
                      amount: getStakeAmount(trade_option),
                      basis: trade_option.basis,
                      contract_type,
                      currency: trade_option.currency,
                      duration: trade_option.duration,
                      duration_unit: trade_option.duration_unit,
                      multiplier: trade_option.multiplier,
                      symbol: trade_option.symbol,
                  },
              }
            : {
                  buy: '1',
                  price: getStakeAmount(trade_option),
                  parameters: {
                      amount: getStakeAmount(trade_option),
                      basis: trade_option.basis,
                      contract_type,
                      currency: trade_option.currency,
                      duration: trade_option.duration,
                      duration_unit: trade_option.duration_unit,
                      multiplier: trade_option.multiplier,
                      symbol: trade_option.symbol,
                  },
              }
        : vh_active
        ? {
              buy_contract_for_multiple_accounts: '1',
              tokens: [getToken().token, ...cp_tokens],
              price: getStakeAmount(trade_option),
              subscribe: 1,
              parameters: {
                  amount: getStakeAmount(trade_option),
                  basis: trade_option.basis,
                  contract_type,
                  currency: trade_option.currency,
                  duration: trade_option.duration,
                  duration_unit: trade_option.duration_unit,
                  multiplier: trade_option.multiplier,
                  symbol: trade_option.symbol,
              },
          }
        : {
              buy_contract_for_multiple_accounts: '1',
              tokens: [getToken().token, ...cp_tokens],
              price: getStakeAmount(trade_option),
              parameters: {
                  amount: getStakeAmount(trade_option),
                  basis: trade_option.basis,
                  contract_type,
                  currency: trade_option.currency,
                  duration: trade_option.duration,
                  duration_unit: trade_option.duration_unit,
                  multiplier: trade_option.multiplier,
                  symbol: trade_option.symbol,
              },
          };

    if (config.pred_setter.allow_pred_setter) {
        trade_option.prediction = config.pred_setter.prediction;
    }

    if (unwantedContracts.includes(contract_type)) {
        delete trade_option.prediction;
        delete trade_option.barrier;
        delete trade_option.barrierOffset;
        delete trade_option.secondBarrierOffset;
    }

    if (trade_option.prediction !== undefined) {
        buy.parameters.selected_tick = trade_option.prediction;
    }
    if (!['TICKLOW', 'TICKHIGH'].includes(contract_type) && trade_option.prediction !== undefined) {
        buy.parameters.barrier = trade_option.prediction;
    } else if (trade_option.barrierOffset !== undefined) {
        // Configured barrier for touch/notouch changer offseter blocky
        if (buy.parameters.contract_type === 'NOTOUCH' || buy.parameters.contract_type === 'ONETOUCH') {
            if (config.touch_notouch_vars.barrier_offset_active) {
                buy.parameters.barrier = config.touch_notouch_vars.barrier_offset;
            } else {
                buy.parameters.barrier = trade_option.barrierOffset;
            }
        } else {
            buy.parameters.barrier = trade_option.barrierOffset;
        }
    }
    if (trade_option.secondBarrierOffset !== undefined) {
        buy.parameters.barrier2 = trade_option.secondBarrierOffset;
    }
    if (!isEmptyObject(trade_option.app_markup_percentage)) {
        buy.parameters.app_markup_percentage = trade_option.app_markup_percentage;
    }
    if (!isEmptyObject(trade_option.barrier_range)) {
        buy.parameters.barrier_range = trade_option.barrier_range;
    }
    if (!isEmptyObject(trade_option.date_expiry)) {
        buy.parameters.date_expiry = trade_option.date_expiry;
    }
    if (!isEmptyObject(trade_option.date_start)) {
        buy.parameters.date_start = trade_option.date_start;
    }
    if (!isEmptyObject(trade_option.product_type)) {
        buy.parameters.product_type = trade_option.product_type;
    }
    if (!isEmptyObject(trade_option.trading_period_start)) {
        buy.parameters.trading_period_start = trade_option.trading_period_start;
    }
    // This will be required only in the case of multiplier & accumulator contracts
    if (!isEmptyObject(trade_option.limit_order)) {
        buy.parameters.limit_order = trade_option.limit_order;
    }
    // This will be required only in the case of multiplier contracts
    if (['MULTUP', 'MULTDOWN'].includes(contract_type)) {
        buy.parameters.duration = undefined;
        buy.parameters.duration_unit = undefined;

        buy.parameters.multiplier = trade_option.multiplier;
    }
    // This will be required only in the case of accumulator contracts
    if (['ACCU'].includes(contract_type)) {
        buy.parameters.growth_rate = trade_option.growth_rate;
    }
    return buy;
};

export const getDirection = ticks => {
    const { length } = ticks;
    const [tickOld, tickNew] = ticks.slice(-2);

    let direction = '';
    if (length >= 2) {
        direction = tickOld.quote < tickNew.quote ? 'rise' : direction;
        direction = tickOld.quote > tickNew.quote ? 'fall' : direction;
    }

    return direction;
};

export const getLastDigit = tick => {
    let number_string = tick;
    if (typeof number_string === 'number') {
        number_string = String(number_string);
    }
    return Number(number_string[number_string.length - 1]);
};

export const getLastDigitForList = (tick, pip_size = 0) => {
    const value = Number(tick).toFixed(pip_size);
    return value[value.length - 1];
};

const getBackoffDelayInMs = (error, delay_index) => {
    const base_delay = 2.5;
    const max_delay = 15;
    const next_delay_in_seconds = Math.min(base_delay * delay_index, max_delay);

    if (error.error.code === 'RateLimit') {
        logError(
            localize('You are rate limited for: {{ message_type }}, retrying in {{ delay }}s (ID: {{ request }})', {
                message_type: error.msg_type,
                delay: next_delay_in_seconds,
                request: error.echo_req.req_id,
            })
        );
    } else if (error.error.code === 'DisconnectError') {
        logError(
            localize('You are disconnected, retrying in {{ delay }}s', {
                delay: next_delay_in_seconds,
            })
        );
    } else if (error.error.code === 'MarketIsClosed') {
        logError(localize('This market is presently closed.'));
    } else {
        logError(
            localize('Request failed for: {{ message_type }}, retrying in {{ delay }}s', {
                message_type: error.msg_type || localize('unknown'),
                delay: next_delay_in_seconds,
            })
        );
    }

    return next_delay_in_seconds * 1000;
};

export const updateErrorMessage = error => {
    if (error.error?.code === 'InputValidationFailed') {
        if (error.error.details?.duration) {
            error.error.message = localize('Duration must be a positive integer');
        }
        if (error.error.details?.amount) {
            error.error.message = localize('Amount must be a positive number.');
        }
    }
};

export const shouldThrowError = (error, errors_to_ignore = []) => {
    if (!error.error) {
        return false;
    }

    const default_errors_to_ignore = [
        'CallError',
        'WrongResponse',
        'GetProposalFailure',
        'RateLimit',
        'DisconnectError',
        'MarketIsClosed',
    ];
    updateErrorMessage(error);
    const is_ignorable_error = errors_to_ignore.concat(default_errors_to_ignore).includes(error.error.code);

    return !is_ignorable_error;
};

export const recoverFromError = (promiseFn, recoverFn, errors_to_ignore, delay_index, api_base) => {
    return new Promise((resolve, reject) => {
        const promise = promiseFn();

        if (promise) {
            promise.then(resolve).catch(error => {
                /**
                 * if bot is not running there is no point of recovering from error
                 * `!api_base.is_running` will check the bot status if it is not running it will kick out the control from loop
                 */
                if (shouldThrowError(error, errors_to_ignore) || (api_base && !api_base.is_running)) {
                    reject(error);
                    return;
                }
                recoverFn(
                    error.error.code,
                    () =>
                        new Promise(recoverResolve => {
                            const getGlobalTimeouts = () => globalObserver.getState('global_timeouts') ?? [];

                            const timeout = setTimeout(() => {
                                const global_timeouts = getGlobalTimeouts();
                                delete global_timeouts[timeout];
                                globalObserver.setState(global_timeouts);
                                recoverResolve();
                            }, getBackoffDelayInMs(error, delay_index));

                            const global_timeouts = getGlobalTimeouts();
                            const cancellable_timeouts = ['buy'];
                            const msg_type = findValueByKeyRecursively(error, 'msg_type');

                            global_timeouts[timeout] = {
                                is_cancellable: cancellable_timeouts.includes(msg_type),
                                msg_type,
                            };

                            globalObserver.setState({ global_timeouts });
                        })
                );
            });
        } else {
            resolve();
        }
    });
};

/**
 * @param {*} promiseFn api call - it could be api call or subscription
 * @param {*} errors_to_ignore list of errors to ignore
 * @param {*} api_base instance of APIBase class to check if the bot is running or not
 * @returns a new promise
 */
export const doUntilDone = (promiseFn, errors_to_ignore, api_base) => {
    let delay_index = 1;

    return new Promise((resolve, reject) => {
        const recoverFn = (error_code, makeDelay) => {
            delay_index++;
            makeDelay().then(repeatFn);
        };

        const repeatFn = () => {
            recoverFromError(promiseFn, recoverFn, errors_to_ignore, delay_index, api_base).then(resolve).catch(reject);
        };

        repeatFn();
    });
};

export const createDetails = contract => {
    const { sell_price: sellPrice, buy_price: buyPrice, currency } = contract;
    const profit = getRoundedNumber(sellPrice - buyPrice, currency);
    const result = profit < 0 ? 'loss' : 'win';

    return [
        contract.transaction_ids.buy,
        +contract.buy_price,
        +contract.sell_price,
        profit,
        contract.contract_type,
        formatTime(parseInt(`${contract.entry_tick_time}000`), 'HH:mm:ss'),
        +contract.entry_tick,
        formatTime(parseInt(`${contract.exit_tick_time}000`), 'HH:mm:ss'),
        +contract.exit_tick,
        +(contract.barrier ? contract.barrier : 0),
        result,
    ];
};

export const getUUID = () => `${new Date().getTime() * Math.random()}`;

const hasBlockOfType = (targetType, workspace) => {
    const allBlocks = workspace.getAllBlocks();
    return allBlocks.some(block => block.type === targetType && !!block.parentBlock_);
};

export const checkBlocksForProposalRequest = () => {
    const workspace = Blockly.derivWorkspace;
    const has_payout_block = hasBlockOfType('payout', workspace);

    // Code for the future for case when basis: 'payout':
    // * Since basis : '${block.type === 'trade_definition_tradeoptions' ? 'stake' : 'payout'}'
    // * basis: 'payout' when contract_type: "MULTUP"
    // Uncomment next line later:
    // const is_basis_payout = !hasBlockOfType('trade_definition_tradeoptions', workspace);

    return {
        has_payout_block,
        is_basis_payout: false,
    };
};

export const socket_state = {
    [WebSocket.CONNECTING]: 'Connecting',
    [WebSocket.OPEN]: 'Connected',
    [WebSocket.CLOSING]: 'Closing',
    [WebSocket.CLOSED]: 'Closed',
};

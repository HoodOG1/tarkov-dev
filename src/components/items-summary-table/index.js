import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css'; // optional
import Icon from '@mdi/react';
import { 
    mdiCloseOctagon, 
    mdiHelpRhombus,
    mdiCached,
    mdiClipboardList,
    mdiTimerSand,
} from '@mdi/js';

import DataTable from '../data-table';
import ItemNameCell from '../item-name-cell';
import CenterCell from '../center-cell';
import ValueCell from '../value-cell';
import BarterTooltip from '../barter-tooltip';

import formatPrice from '../../modules/format-price';
import { getCheapestPrice } from '../../modules/format-cost-items';

import { useItemsData } from '../../features/items/itemsSlice';
import { useBartersData } from '../../features/barters/bartersSlice';
import { useCraftsData } from '../../features/crafts/craftsSlice';

import FleaMarketLoadingIcon from '../FleaMarketLoadingIcon';

import './index.css';

const ConditionalWrapper = ({ condition, wrapper, children }) => {
    return condition ? wrapper(children) : children;
};

function ItemsSummaryTable({includeItems}) {
    const { t } = useTranslation();

    const settings = useSelector((state) => state.settings);
    const { data: items } = useItemsData();
    const { data: barters } = useBartersData();
    const { data: crafts } = useCraftsData();

    const data = useMemo(() => {
        return items
            .filter((item) => includeItems.some(it => it.id === item.id))
            .map((item) => {
                const formattedItem = {
                    ...item,
                    quantity: includeItems.find(
                        (includeItem) => includeItem.id === item.id,
                    ).quantity,
                    itemLink: `/item/${item.normalizedName}`,
                    barters: barters.filter(
                        (barter) => barter.rewardItems[0].item.id === item.id,
                    ),
                    buyOnFleaPrice: item.buyFor.find(
                        (buyPrice) => buyPrice.vendor.normalizedName === 'flea-market',
                    ),
                };

                formattedItem.cheapestObtainInfo = getCheapestPrice(formattedItem, {barters: false, crafts, settings, useBarterIngredients: false, useCraftIngredients: false});
                formattedItem.cheapestPrice = formattedItem.cheapestObtainInfo.pricePerUnit;
                if (formattedItem.id === '5449016a4bdc2d6f028b456f') {
                    formattedItem.cheapestPrice = 1;
                    formattedItem.cheapestObtainInfo.price = 1;
                    formattedItem.cheapestObtainInfo.priceRUB = 1;
                    formattedItem.cheapestObtainInfo.pricePerUnit = 1;
                }

                formattedItem.totalPrice = formattedItem.cheapestObtainInfo.pricePerUnit * formattedItem.quantity;

                return formattedItem;
            });
    }, [items, includeItems, settings, barters, crafts]);

    let displayColumns = useMemo(() => {
        const useColumns = [
            {
                Header: t('Item'),
                id: 'name',
                accessor: 'name',
                Cell: (props) => {
                    return (
                        <ItemNameCell
                            item={props.row.original}
                            items={items}
                        />
                    );
                },
            },
            {
                Header: t('Amount'),
                id: 'quantity',
                accessor: 'quantity',
                Cell: props => {
                    return <CenterCell value={props.value.toLocaleString()}/>
                },
            },
            {
                Header: t('Cheapest Price'),
                id: 'cheapestPrice',
                accessor: 'cheapestPrice',
                sortType: (a, b, columnId, desc) => {
                    const aCheap = a.values.cheapestPrice || (desc ? Number.MIN_SAFE_INTEGER : Number.MAX_SAFE_INTEGER);
                    const bCheap = b.values.cheapestPrice || (desc ? Number.MIN_SAFE_INTEGER : Number.MAX_SAFE_INTEGER);
                    return aCheap - bCheap;
                },
                Cell: (props) => {
                    let tipContent = '';
                    const priceContent = [];
                    const cheapestObtainInfo = props.row.original.cheapestObtainInfo;
                    if (cheapestObtainInfo) {
                        let priceSource = '';
                        const displayedPrice = [];
                        let taskIcon = '';
                        let barterIcon = '';
                        if (!cheapestObtainInfo.barter && !cheapestObtainInfo.craft) {
                            if (props.row.original.id === '5449016a4bdc2d6f028b456f') {
                                priceSource = '';
                            } else if (cheapestObtainInfo.vendor.normalizedName === 'flea-market') {
                                priceSource = cheapestObtainInfo.vendor.name;
                            }
                            else {
                                priceSource = `${cheapestObtainInfo.vendor.name} ${t('LL{{level}}', { level: cheapestObtainInfo.vendor.minTraderLevel })}`;
                            }
                            if (cheapestObtainInfo.vendor?.taskUnlock) {
                                taskIcon = (
                                    <Icon
                                        key="price-task-tooltip-icon"
                                        path={mdiClipboardList}
                                        size={1}
                                        className="icon-with-text"
                                    />
                                );
                                tipContent = (
                                    <div>
                                        <Link to={`/task/${cheapestObtainInfo.vendor.taskUnlock.normalizedName}`}>
                                            {t('Task: {{taskName}}', {taskName: cheapestObtainInfo.vendor.taskUnlock.name})}
                                        </Link>
                                    </div>
                                );
                            }
                        } else if (cheapestObtainInfo.barter) {
                            priceSource = `${cheapestObtainInfo.barter.trader.name} ${t('LL{{level}}', { level: cheapestObtainInfo.barter.level })}`;
                            barterIcon = (
                                <Icon
                                    key="barter-tooltip-icon"
                                    path={mdiCached}
                                    size={1}
                                    className="icon-with-text"
                                />
                            );
                            let barterTipTitle = '';
                            if (cheapestObtainInfo.barter.taskUnlock) {
                                taskIcon = (
                                    <Icon
                                        key="barter-task-tooltip-icon"
                                        path={mdiClipboardList}
                                        size={1}
                                        className="icon-with-text"
                                    />
                                );
                                barterTipTitle = (
                                    <Link to={`/task/${cheapestObtainInfo.barter.taskUnlock.normalizedName}`}>
                                        {t('Task: {{taskName}}', {taskName: cheapestObtainInfo.barter.taskUnlock.name})}
                                    </Link>
                                );
                            }
                            tipContent = (
                                <BarterTooltip
                                    barter={cheapestObtainInfo.barter}
                                    showTitle={taskIcon !== ''}
                                    title={barterTipTitle}
                                    allowAllSources={false}
                                    barters={barters}
                                    crafts={crafts}
                                    useBarterIngredients={false}
                                    useCraftIngredients={false}
                                />
                            );
                        } else if (cheapestObtainInfo.craft) {
                            const craft = cheapestObtainInfo.craft;
                            priceSource = `${craft.station.name} ${craft.level}`;
                            let barterTipTitle = '';
                            if (craft.taskUnlock) {
                                taskIcon = (
                                    <Icon
                                        key="craft-task-tooltip-icon"
                                        path={mdiClipboardList}
                                        size={1}
                                        className="icon-with-text"
                                    />
                                );
                                barterTipTitle = (
                                    <Link to={`/task/${craft.taskUnlock.normalizedName}`}>
                                        {t('Task: {{taskName}}', {taskName: craft.taskUnlock.name})}
                                    </Link>
                                );
                            }
                            tipContent = (
                                <BarterTooltip
                                    barter={craft}
                                    showTitle={taskIcon !== ''}
                                    title={barterTipTitle}
                                    allowAllSources={false}
                                    barters={barters}
                                    crafts={crafts}
                                    useBarterIngredients={false}
                                    useCraftIngredients={false}
                                />
                            );
                        }
                        displayedPrice.push(priceSource);
                        displayedPrice.push(barterIcon);
                        displayedPrice.push(taskIcon);
                        priceContent.push((<div key="price-info">{formatPrice(props.value)}</div>));
                        priceContent.push((<div key="price-source-info" className="trader-unlock-wrapper">{displayedPrice}</div>))
                    } else {
                        tipContent = [];
                        if (props.row.original.types.includes('noFlea')) {
                            priceContent.push((
                                <Icon
                                    path={mdiCloseOctagon}
                                    size={1}
                                    className="icon-with-text"
                                    key="no-flea-icon"
                                />
                            ));
                            tipContent.push((
                                <div key={'no-flea-tooltip'}>
                                    {t('This item can\'t be sold on the Flea Market')}
                                </div>
                            ));
                        } else if (!settings.hasFlea) {
                            priceContent.push((
                                <Icon
                                    path={mdiCloseOctagon}
                                    size={1}
                                    className="icon-with-text"
                                    key="no-prices-icon"
                                />
                            ));
                            tipContent.push((
                                <div key={'no-flea-tooltip'}>
                                    {t('Flea Market not available')}
                                </div>
                            ));
                        } else {
                            let tipText = t('Not scanned on the Flea Market');
                            let icon = mdiHelpRhombus;
                            if (props.row.original.cached) {
                                tipText = t('Flea market prices loading');
                                icon = mdiTimerSand;
                            }
                            priceContent.push((
                                <Icon
                                    path={icon}
                                    size={1}
                                    className="icon-with-text"
                                    key="no-prices-icon"
                                />
                            ));
                            tipContent.push((
                                <div key={'no-flea-tooltip'}>
                                    {tipText}
                                </div>
                            ));
                        }
                        tipContent.push((
                            <div key={'no-trader-sell-tooltip'}>
                                {t('No trader offers available')}
                            </div>
                        ));
                    }
                    return (
                        <ConditionalWrapper
                            condition={tipContent}
                            wrapper={(children) => {
                                return (
                                    <Tippy placement="right" content={tipContent} interactive={true}>
                                        {children}
                                    </Tippy>
                                );
                            }}
                        >
                            <div className="center-content">
                                {priceContent}
                            </div>
                        </ConditionalWrapper>
                    );
                },
            },
            {
                Header: t('Cost'),
                id: 'totalPrice',
                accessor: 'totalPrice',
                Cell: (props) => {
                    if (!props.value && props.row.original.cached) {
                        return (
                            <div className="center-content">
                                <FleaMarketLoadingIcon/>
                            </div>
                        );
                    }
                    return <ValueCell value={props.value}/>;
                },
            },
        ];

        return useColumns;
    }, [t, items, barters, crafts, settings]);

    const extraRow = (
        <>
            {t('Cost')}:{' '}
            {formatPrice(
                data.reduce((previousValue, currentValue) => {
                    return previousValue + currentValue.totalPrice;
                }, 0),
            )}
        </>
    );

    return (
        <DataTable
            key="item-summary-table"
            columns={displayColumns}
            data={data}
            extraRow={extraRow}
            autoResetSortBy={false}
        />
    );
}

export default ItemsSummaryTable;

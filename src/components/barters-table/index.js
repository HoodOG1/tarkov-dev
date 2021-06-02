import {useMemo, useEffect} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    Link,
} from "react-router-dom";


import DataTable from '../../components/data-table';
import formatPrice from '../../modules/format-price';
import { selectAllBarters, fetchBarters } from '../../features/barters/bartersSlice';

function priceCell({ value }) {
    return <div
        className = 'center-content'
    >
        {formatPrice(value)}
    </div>;
};

function profitCell({ value }) {
    return <div
        className = {`center-content ${value > 0 ? 'craft-profit' : 'craft-loss'}`}
    >
        {formatPrice(value)}
    </div>;
};

function costItemsCell({ value }) {
    return <div
        className = 'cost-wrapper'
    >
        {value.map((costItem, itemIndex) => {
            return <div
                key = {`cost-item-${itemIndex}`}
                className = 'barter-cost-item-wrapper'
            >
                {/* <div
                    className = 'barter-cost-item-count-wrapper'
                >
                    {costItem.count}
                </div> */}
                <div
                    className = 'barter-cost-image-wrapper'
                >
                    <img
                        alt = {costItem.name}
                        loading = 'lazy'
                        src = {costItem.iconLink}
                    />
                </div>
                <div
                    className = 'barter-cost-item-text-wrapper'
                >
                    <Link
                        to = {costItem.itemLink}
                    >
                        {costItem.name}
                    </Link>
                    <div
                        className = 'price-wrapper'
                    >
                        <span className = 'barter-cost-item-count-wrapper'>{costItem.count}</span> X {formatPrice(costItem.avg24hPrice)} = {formatPrice(costItem.count * costItem.avg24hPrice)}
                        {/* {formatPrice(costItem.avg24hPrice)} */}
                    </div>
                </div>
            </div>
        })}
    </div>;
};

function BartersTable(props) {
    const { selectedTrader, nameFilter, levelFilter = 3} = props;
    const dispatch = useDispatch();

    const barters = useSelector(selectAllBarters);
    const bartersStatus = useSelector((state) => {
        return state.barters.status;
    });

    useEffect(() => {
        if (bartersStatus === 'idle') {
          dispatch(fetchBarters());
        }
    }, [bartersStatus, dispatch]);

    const columns = useMemo(
        () => [
            {
                Header: 'Reward',
                accessor: 'reward',
                Cell: ({ value }) => {
                    return <div
                        className = 'barter-reward-wrapper'
                    >
                        <div
                            className = 'barter-reward-image-wrapper'
                        >
                            <img
                                alt = ''
                                className = 'table-image'
                                loading = 'lazy'
                                src = { value.iconLink }
                            />
                        </div>
                        <div
                            className = 'barter-reward-info-wrapper'
                        >
                            <div>
                                <Link
                                    className = 'barter-reward-item-title'
                                    to = {value.itemLink}

                                >
                                    {value.name}
                                </Link>
                            </div>
                            <div
                                className = 'trader-wrapper'
                            >
                                {value.trader}
                            </div>
                            <div
                                className = 'price-wrapper'
                            >
                                {formatPrice(value.value)}
                                {value.barterOnly && <span> (Barter only)</span>}
                            </div>
                        </div>
                    </div>
                },
            },
            {
                Header: 'Cost',
                accessor: 'costItems',
                Cell: costItemsCell,
            },
            {
                Header: 'Cost ₽',
                accessor: 'cost',
                Cell: priceCell,
            },
            {
                Header: 'Estimated savings',
                accessor: d=>Number(d.savings),
                Cell: profitCell,
                sortType: (a, b) => {
                    if(a.value > b.value){
                        return 1;
                    }

                    if(a.value < b.value){
                        return -1;
                    }

                    return 0;
                },
            },
        ],
        []
    );

    const data = useMemo(() => {
        let addedTraders = [];

        return barters.map((barterRow) => {
            let cost = 0;

            if(!barterRow.rewardItems[0]){
                console.log(barterRow);
                return false;
            }

            if(nameFilter.length > 0){
                let matchesFilter = false;
                const findString = nameFilter.toLowerCase().replace(/\s/g, '');
                for(const requiredItem of barterRow.requiredItems){
                    if(requiredItem === null){
                        continue;
                    }

                    if(requiredItem.item.name.toLowerCase().replace(/\s/g, '').includes(findString)){
                        matchesFilter = true;

                        break;
                    }
                }

                for(const rewardItem of barterRow.rewardItems){
                    if(rewardItem.item.name.toLowerCase().replace(/\s/g, '').includes(findString)){
                        matchesFilter = true;

                        break;
                    }
                }

                if(!matchesFilter){
                    return false;
                }
            }

            // let hasZeroCostItem = false;
            let [trader, level] = barterRow.source.split('LL');

            level = parseInt(level);
            trader = trader.trim();

            if(!nameFilter && selectedTrader && selectedTrader !== 'all' && selectedTrader !== trader.toLowerCase().replace(/\s/g, '-')){
                return false;
            }

            if(level > levelFilter.value){
                return false;
		    }

            const tradeData = {
                costItems: barterRow.requiredItems.map(requiredItem => {
                        if(requiredItem === null){
                            // console.log(barterRow);

                            return false;
                        }

                        if(!requiredItem.item){
                            // console.log(requiredItem);

                            return false;
                        }

                        const requiredItemPrice = requiredItem.item.avg24hPrice || Math.max(...requiredItem.item.traderPrices.map(priceObject => priceObject.price))

                        cost = cost + requiredItemPrice * requiredItem.count;

                        // if(cost === 0){
                        //     hasZeroCostItem = true;
                        // }

                        return {
                            count: requiredItem.count,
                            name: requiredItem.item.name,
                            avg24hPrice: requiredItemPrice,
                            iconLink: requiredItem.item.iconLink,
                            wikiLink: requiredItem.item.wikiLink,
                            itemLink: `/item/${requiredItem.item.normalizedName}`,
                        };
                    })
                    .filter(Boolean),
                cost: cost,
                reward: {
                    name: barterRow.rewardItems[0].item.name,
                    wikiLink: barterRow.rewardItems[0].item.wikiLink,
                    value: barterRow.rewardItems[0].item.avg24hPrice || Math.max(...barterRow.rewardItems[0].item.traderPrices.map(priceObject => priceObject.price)),
                    trader: barterRow.source,
                    iconLink: barterRow.rewardItems[0].item.iconLink,
                    itemLink: `/item/${barterRow.rewardItems[0].item.normalizedName}`,
                },
            };

            tradeData.savings = tradeData.reward.value - cost;

            // If the reward has no value, it's not available for purchase
            if(tradeData.reward.value === 0){
                tradeData.reward.value = tradeData.cost;
                tradeData.reward.barterOnly = true;
                tradeData.savings = 0;
            }

            // if(hasZeroCostItem){
            //     return false;
            // }

            return tradeData;
        })
        .filter(Boolean)
        .sort((itemA, itemB) => {
            if(itemB.savings > itemA.savings){
                return -1;
            };

            if(itemB.savings < itemA.savings){
                return 1;
            }

            return 0;
        })
        .filter((barter) => {

            if(selectedTrader !== 'all'){
                return true;
		    }

            if(selectedTrader === 'all'){
                return true;
			}

            if(addedTraders.includes(barter.reward.source)){
                return false;
		    }

            addedTraders.push(barter.reward.source);

            return true;
	    });
    },
        [nameFilter, levelFilter, selectedTrader, barters]
    );

    if(data.length <= 0){
        return <div>
            None
        </div>;
    }

    return <DataTable
        columns={columns}
        key = 'barters-table'
        data={data}
    />;
};

export default BartersTable;
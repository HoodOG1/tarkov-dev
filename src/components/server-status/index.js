import { useQuery } from 'react-query';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css'; // optional
import './index.css';


function ServerStatus() {
    const { status, data } = useQuery(`server-status`, () =>
        fetch('https://tarkov-tools.com/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: dataQuery,
            })
            .then(response => response.json() )
    );

    const dataQuery = JSON.stringify({query: `{
        status {
            generalStatus {
                name
                message
                status
            }
            messages {
                time
                type
                content
                solveTime
            }
        }
    }`});

    if(status !== 'success' || !data.data.status){
        return null;
    }

    if(status === 'success' && data.data.status.length === 0){
        return 'No data';
    }

    return <div
        className={`server-status-wrapper`}
    >
        <Tippy
            placement='top'
            content={data.data.status.messages[0]?.content}
        >
            <a
                href = 'https://status.escapefromtarkov.com/'
            >
                {`Tarkov server status`}
                <div
                    className={`status-indicator status-${data.data.status.generalStatus.status}`}
                />
                <div
                    className='server-status-message-wrapper'
                >
                    {data.data.status.generalStatus.message}
                </div>
            </a>
        </Tippy>
    </div>;
}

export default ServerStatus;
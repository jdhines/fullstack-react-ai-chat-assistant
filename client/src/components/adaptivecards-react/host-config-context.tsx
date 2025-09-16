// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { createContext, useContext } from 'react';
import { AdaptiveCard } from './adaptive-card';
import type {FC} from 'react';
import type {Props }from './adaptive-card';

interface HostConfig {
    hostConfig: object;
}

export const HostConfigContext = createContext<HostConfig>({ hostConfig: null });

export type PropsWithoutHostConfig = Omit<Props, 'hostConfig'>;
export const AdaptiveCardUsingHostConfigContext: FC<PropsWithoutHostConfig> = (props) => {
    const context = useContext(HostConfigContext);
    return <AdaptiveCard {...props} hostConfig={context.hostConfig} />;
};


export const ProvidesHostConfigContext: FC<{ hostConfig: object }> = ({ hostConfig, children }) => {
    return <HostConfigContext.Provider value={{ hostConfig }} >{children}</HostConfigContext.Provider>
};
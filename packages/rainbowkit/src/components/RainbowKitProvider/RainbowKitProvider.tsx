import React, { type ReactNode, createContext, useContext } from 'react';
import { useAccountEffect } from 'wagmi';
import type { Chain } from 'wagmi/chains';
import { cssStringFromTheme } from '../../css/cssStringFromTheme';
import type { ThemeVars } from '../../css/sprinkles.css';
import type { Locale } from '../../locales';
import { lightTheme } from '../../themes/lightTheme';
import { TransactionStoreProvider } from '../../transactions/TransactionStoreContext';
import {
  AppContext,
  type DisclaimerComponent,
  defaultAppInfo,
} from './AppContext';
import {
  type AvatarComponent,
  AvatarContext,
  defaultAvatar,
} from './AvatarContext';
import { CoolModeContext } from './CoolModeContext';
import { I18nProvider } from './I18nContext';
import { ModalProvider } from './ModalContext';
import {
  ModalSizeOptions,
  ModalSizeProvider,
  type ModalSizes,
} from './ModalSizeContext';
import { RainbowKitChainProvider } from './RainbowKitChainContext';
import { ShowBalanceProvider } from './ShowBalanceContext';
import { ShowRecentTransactionsContext } from './ShowRecentTransactionsContext';
import { WalletButtonProvider } from './WalletButtonContext';
import { useFingerprint } from './useFingerprint';
import { usePreloadImages } from './usePreloadImages';
import { clearWalletConnectDeepLink } from './walletConnectDeepLink';

const ThemeIdContext = createContext<string | undefined>(undefined);

const attr = 'data-rk';

const createThemeRootProps = (id: string | undefined) => ({ [attr]: id || '' });

const createThemeRootSelector = (id: string | undefined) => {
  if (id && !/^[a-zA-Z0-9_]+$/.test(id)) {
    throw new Error(`Invalid ID: ${id}`);
  }

  return id ? `[${attr}="${id}"]` : `[${attr}]`;
};

export const useThemeRootProps = () => {
  const id = useContext(ThemeIdContext);
  return createThemeRootProps(id);
};

export type Theme =
  | ThemeVars
  | {
      lightMode: ThemeVars;
      darkMode: ThemeVars;
    };

export interface RainbowKitProviderProps {
  initialChain?: Chain | number;
  id?: string;
  children: ReactNode;
  theme?: Theme | null;
  showRecentTransactions?: boolean;
  appInfo?: {
    appName?: string;
    learnMoreUrl?: string;
    disclaimer?: DisclaimerComponent;
  };
  coolMode?: boolean;
  avatar?: AvatarComponent;
  modalSize?: ModalSizes;
  locale?: Locale;
}

const defaultTheme = lightTheme();

export function RainbowKitProvider({
  appInfo,
  avatar,
  children,
  coolMode = false,
  id,
  initialChain,
  locale,
  modalSize = ModalSizeOptions.WIDE,
  showRecentTransactions = false,
  theme = defaultTheme,
}: Readonly<RainbowKitProviderProps>) {
  usePreloadImages();
  useFingerprint();

  useAccountEffect({ onDisconnect: clearWalletConnectDeepLink });

  if (typeof theme === 'function') {
    throw new Error(
      'A theme function was provided to the "theme" prop instead of a theme object. You must execute this function to get the resulting theme object.',
    );
  }

  const selector = createThemeRootSelector(id);

  const appContext = {
    ...defaultAppInfo,
    ...appInfo,
  };

  const avatarContext = avatar ?? defaultAvatar;

  const themeStyles = theme
    ? [
        `${selector}{${cssStringFromTheme(
          'lightMode' in theme ? theme.lightMode : theme,
        )}}`,
        'darkMode' in theme
          ? `@media(prefers-color-scheme:dark){${selector}{${cssStringFromTheme(
              theme.darkMode,
              { extends: theme.lightMode },
            )}}}`
          : null,
      ].join('')
    : '';

  return (
    <RainbowKitChainProvider initialChain={initialChain}>
      <WalletButtonProvider>
        <I18nProvider locale={locale}>
          <CoolModeContext.Provider value={coolMode}>
            <ModalSizeProvider modalSize={modalSize}>
              <ShowRecentTransactionsContext.Provider
                value={showRecentTransactions}
              >
                <TransactionStoreProvider>
                  <AvatarContext.Provider value={avatarContext}>
                    <AppContext.Provider value={appContext}>
                      <ThemeIdContext.Provider value={id}>
                        <ShowBalanceProvider>
                          <ModalProvider>
                            {theme ? (
                              <>
                                <style>{themeStyles}</style>
                                {children}
                              </>
                            ) : (
                              children
                            )}
                          </ModalProvider>
                        </ShowBalanceProvider>
                      </ThemeIdContext.Provider>
                    </AppContext.Provider>
                  </AvatarContext.Provider>
                </TransactionStoreProvider>
              </ShowRecentTransactionsContext.Provider>
            </ModalSizeProvider>
          </CoolModeContext.Provider>
        </I18nProvider>
      </WalletButtonProvider>
    </RainbowKitChainProvider>
  );
}

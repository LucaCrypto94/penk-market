import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, goerli, polygonMumbai, optimismSepolia, arbitrumSepolia, baseSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Penk Market',
  projectId: 'YOUR_PROJECT_ID', // You can get this from WalletConnect
  chains: [sepolia, goerli, polygonMumbai, optimismSepolia, arbitrumSepolia, baseSepolia],
  ssr: true,
});

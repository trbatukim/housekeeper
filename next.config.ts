import type { NextConfig } from "next";
import dns from 'node:dns'
import { setDefaultAutoSelectFamilyAttemptTimeout } from 'node:net'
import { setGlobalDispatcher, Agent } from 'undici'

setGlobalDispatcher(new Agent({ connect: { family: 4 } }))
setDefaultAutoSelectFamilyAttemptTimeout(100)
dns.setDefaultResultOrder('ipv4first')

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

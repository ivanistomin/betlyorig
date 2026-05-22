const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDownUp, Wallet, ExternalLink, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTelegram } from '@/lib/useTelegram';
import { useProfile } from '@/lib/useProfile';
import GemsBadge from '@/components/common/GemsBadge';
import GemIcon from '@/components/common/GemIcon.jsx';
import { toast } from 'sonner';

const GEM_TO_TON_RATE = 0.0001; // 1 GEM = 0.0001 TON (10000 GEMS = 1 TON)
const MIN_EXCHANGE = 10000; // Minimum 10,000 GEMS = 1 TON
const TON_TO_GEM_RATE = 10000; // 1 TON = 10,000 GEMS

const PACKAGES = [
  { gems: 10000, ton: 1.0, label: 'Starter' },
  { gems: 25000, ton: 2.5, label: 'Player' },
  { gems: 50000, ton: 5.0, label: 'Pro' },
  { gems: 100000, ton: 10.0, label: 'Legend' },
];

export default function Exchange() {
  const [mode, setMode] = useState('sell'); // 'sell' gems for TON | 'buy' GEMS with TON
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [txSuccess, setTxSuccess] = useState(false);

  const { tgUser } = useTelegram();
  const { profile, user, refreshProfile } = useProfile(tgUser);

  const gemsAmount = parseInt(amount) || 0;
  const tonOut = (gemsAmount * GEM_TO_TON_RATE).toFixed(4);
  const hasEnough = profile && gemsAmount >= MIN_EXCHANGE && gemsAmount <= profile.gems_balance;

  const handleSell = async () => {
    if (!hasEnough) return;
    if (!walletAddress.trim()) { toast.error('Enter your TON wallet address'); return; }

    setLoading(true);
    try {
      await db.functions.invoke('sendTelegramNotification', {
        tg_id: profile.tg_id,
        message: `💎➡️TON Exchange Request\n\nAmount: ${gemsAmount} GEMS\nTON to receive: ${tonOut} TON\nWallet: ${walletAddress}\n\nYour request is being processed. TON will be sent within 24h.`,
      });

      await db.entities.UserProfile.update(profile.id, {
        gems_balance: profile.gems_balance - gemsAmount,
        total_gems_lost: (profile.total_gems_lost || 0) + gemsAmount,
      });

      setTxSuccess(true);
      refreshProfile();
      toast.success(`Exchange request sent! ${gemsAmount} 💎 → ${tonOut} TON`);
    } catch (e) {
      toast.error('Error processing request');
    }
    setLoading(false);
  };

  const handleBuyPackage = async (pkg) => {
    const tg = window?.Telegram?.WebApp;
    if (tg) {
      tg.openLink(`https://t.me/PaceUPBot?start=buy_${pkg.gems}`);
    } else {
      toast.info(`To buy ${pkg.gems} GEMS for ${pkg.ton} TON — open PaceUP in Telegram`);
    }
  };

  if (!profile) return null;

  return (
    <div className="px-4 pt-6 space-y-5 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Exchange</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Convert GEMS ↔ TON</p>
      </div>

      {/* Balance */}
      <div className="rounded-xl bg-gradient-to-r from-primary/10 to-neon-cyan/10 border border-primary/20 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Your Balance</p>
          <GemsBadge amount={profile.gems_balance} size="lg" animate />
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Rate</p>
          <p className="text-sm font-heading font-bold text-neon-cyan flex items-center gap-1">10 000 <GemIcon className="w-4 h-4" /> = 1 TON</p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex rounded-xl overflow-hidden border border-border/50 bg-secondary">
        {['sell', 'buy'].map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setAmount(''); setTxSuccess(false); }}
            className={`flex-1 py-2.5 text-sm font-heading font-semibold transition-all ${
              mode === m
                ? 'bg-gradient-to-r from-primary to-neon-cyan text-white'
                : 'text-muted-foreground'
            }`}
          >
            {m === 'sell' ? <span className="flex items-center justify-center gap-1"><GemIcon className="w-4 h-4" /> → TON</span> : <span className="flex items-center justify-center gap-1">TON → <GemIcon className="w-4 h-4" /></span>}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {mode === 'sell' ? (
          <motion.div
            key="sell"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {txSuccess ? (
              <div className="text-center py-10 space-y-3">
                <span className="text-5xl">✅</span>
                <p className="font-heading font-bold text-foreground text-lg">Request Submitted!</p>
                <p className="text-sm text-muted-foreground">TON will be sent to your wallet within 24 hours</p>
                <Button variant="outline" onClick={() => { setTxSuccess(false); setAmount(''); setWalletAddress(''); }}>
                  New Exchange
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">GEMS to exchange</label>
                  <Input
                    type="number"
                    placeholder={`Min. ${MIN_EXCHANGE} GEMS`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-card border-border/50 text-foreground placeholder:text-muted-foreground"
                  />
                  <div className="flex gap-2">
                    {[10000, 20000, 50000, 100000].map((v) => (
                      <button
                        key={v}
                        onClick={() => setAmount(String(v))}
                        disabled={!profile || v > profile.gems_balance}
                        className="flex-1 text-xs py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground border border-border/50 disabled:opacity-30"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center">
                  <div className="w-9 h-9 rounded-full bg-secondary border border-border/50 flex items-center justify-center">
                    <ArrowDownUp className="w-4 h-4 text-primary" />
                  </div>
                </div>

                <div className="rounded-xl bg-card border border-border/50 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">You receive</p>
                    <p className="text-2xl font-heading font-bold text-neon-cyan">{tonOut} <span className="text-base">TON</span></p>
                  </div>
                  <GemIcon className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-neon-cyan" /> TON Wallet Address
                  </label>
                  <Input
                    placeholder="UQ..."
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="bg-card border-border/50 text-foreground placeholder:text-muted-foreground font-mono text-sm"
                  />
                </div>

                <div className="flex items-start gap-2 p-3 rounded-xl bg-neon-gold/5 border border-neon-gold/20">
                  <Info className="w-4 h-4 text-neon-gold mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">Exchange is processed manually within 24h. Minimum: {MIN_EXCHANGE.toLocaleString()} GEMS = {(MIN_EXCHANGE * GEM_TO_TON_RATE).toFixed(1)} TON.</p>
                </div>

                <Button
                  onClick={handleSell}
                  disabled={!hasEnough || loading}
                  className="w-full h-12 bg-gradient-to-r from-neon-cyan to-primary text-white font-heading font-semibold text-base rounded-xl"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="flex items-center gap-1.5 justify-center">Exchange {gemsAmount || 0} <GemIcon className="w-4 h-4" /> → {tonOut} TON</span>}
                </Button>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="buy"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <p className="text-sm text-muted-foreground">Select a GEMS package to purchase via TON:</p>
            {PACKAGES.map((pkg, i) => (
              <motion.button
                key={pkg.gems}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleBuyPackage(pkg)}
                className="w-full rounded-xl bg-card border border-border/50 p-4 flex items-center justify-between hover:border-primary/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-neon-cyan/20 flex items-center justify-center">
                    <GemIcon className="w-7 h-7" />
                  </div>
                  <div className="text-left">
                    <p className="font-heading font-bold text-foreground">{pkg.gems.toLocaleString()} GEMS</p>
                    <p className="text-xs text-muted-foreground">{pkg.label} Pack</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-heading font-bold text-neon-cyan">{pkg.ton} TON</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-0.5 justify-end">
                    Pay in TG <ExternalLink className="w-3 h-3" />
                  </p>
                </div>
              </motion.button>
            ))}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-neon-gold/5 border border-neon-gold/20">
              <Info className="w-4 h-4 text-neon-gold mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">Buying GEMS opens payment in Telegram bot. GEMS are credited automatically after payment confirmation.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
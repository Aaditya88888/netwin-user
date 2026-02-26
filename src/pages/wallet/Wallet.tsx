import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet as WalletIcon, Plus, Minus, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, X, Trophy, Target, Gamepad2 } from 'lucide-react';
import UPIAddMoney from "@/components/wallet/UPIAddMoney";
import WithdrawMoney from "@/components/wallet/WithdrawMoney";
import AddMoney from "@/components/wallet/AddMoney";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getPaymentLinkForCountry } from "@/lib/getPaymentLink";

const Wallet = () => {
  const { userProfile } = useAuth();
  const { transactions, loading, refreshTransactions } = useWallet();
  // Open Add Money modal if ?addMoney=1 is in the URL
  const urlParams = new URLSearchParams(window.location.search);
  const [showAddMoney, setShowAddMoney] = useState(urlParams.get('addMoney') === '1');

  // Remove ?addMoney=1 from URL after opening modal (for clean navigation)
  useEffect(() => {
    if (showAddMoney && urlParams.get('addMoney') === '1') {
      const url = new URL(window.location.href);
      url.searchParams.delete('addMoney');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, [showAddMoney]);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string | undefined>(undefined);

  // Treat US users like Nigeria for manual deposit UI and logic
  const isManualDeposit = userProfile && (["Nigeria", "USA", "United States"].includes(userProfile.country));
  // Force currency to NGN for Nigeria and USD for US for AddMoney manual deposit UI
  const manualDepositCurrency =
    userProfile
      ? userProfile.country === "Nigeria"
        ? "NGN"
        : ["USA", "United States"].includes(userProfile.country)
          ? "USD"
          : userProfile.currency || undefined
      : undefined;

  useEffect(() => {
    if (userProfile && isManualDeposit) {
      getPaymentLinkForCountry(userProfile.country).then(link => {
        setPaymentLink(link);
      });
    }
  }, [userProfile, isManualDeposit]);

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        Loading...
      </div>
    );
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'prize_money':
      case 'tournament_reward':
      case 'prize':
        return <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />;
      case 'entry_fee':
      case 'tournament_fee':
        return <Gamepad2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />;
      case 'deposit':
        return <ArrowDownLeft className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />;
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />;
      default:
        return <Target className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />;
    }
  };

  const getTransactionBgColor = (type: string) => {
    switch (type) {
      case 'prize_money':
      case 'tournament_reward':
      case 'prize':
        return 'bg-yellow-600/20';
      case 'entry_fee':
      case 'tournament_fee':
        return 'bg-blue-600/20';
      case 'deposit':
        return 'bg-green-600/20';
      case 'withdrawal':
        return 'bg-red-600/20';
      default:
        return 'bg-gray-600/20';
    }
  };

  const getTransactionTextColor = (type: string) => {
    switch (type) {
      case 'prize_money':
      case 'tournament_reward':
      case 'prize':
      case 'deposit':
        return 'text-green-400';
      case 'entry_fee':
      case 'tournament_fee':
      case 'withdrawal':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getTransactionSign = (type: string) => {
    switch (type) {
      case 'prize_money':
      case 'tournament_reward':
      case 'prize':
      case 'deposit':
        return '+';
      case 'entry_fee':
      case 'tournament_fee':
      case 'withdrawal':
        return '-';
      default:
        return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-900/20 text-green-400 border-green-700";
      case "pending":
        return "bg-yellow-900/20 text-yellow-400 border-yellow-700";
      case "failed":
        return "bg-red-900/20 text-red-400 border-red-700";
      default:
        return "bg-gray-900/20 text-gray-400 border-gray-700";
    }
  };
  return (
    <div className="container-responsive py-4 sm:py-6 md:py-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-responsive-lg font-bold font-poppins">
          My Wallet
        </h1>
      </div>

      {/* Wallet Balance Card - Mobile responsive */}
      <Card className="bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/30 mb-4 sm:mb-6">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg">
            <WalletIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            Wallet Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white">
                {formatCurrency(userProfile.walletBalance, userProfile.currency)}
              </p>
              <p className="text-sm text-gray-300 mt-1">Available Balance</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 touch-target"
                onClick={() => setShowAddMoney(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Add Money</span>
                <span className="sm:hidden">Add</span>
              </Button>              <Button 
                variant="outline" 
                className="flex-1 sm:flex-none border-gray-600 touch-target"
                onClick={() => setShowWithdraw(true)}
              >
                <Minus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Withdraw</span>
                <span className="sm:hidden">Withdraw</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>      {/* Quick Actions - Mobile responsive grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card className="bg-dark-card border-gray-800 cursor-pointer hover:bg-dark-lighter transition-colors" onClick={() => setShowAddMoney(true)}>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
            </div>
            <p className="text-xs sm:text-sm text-gray-300">Add Money</p>
          </CardContent>
        </Card>        <Card className="bg-dark-card border-gray-800 cursor-pointer hover:bg-dark-lighter transition-colors" onClick={() => setShowWithdraw(true)}>
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <Minus className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
            </div>
            <p className="text-xs sm:text-sm text-gray-300">Withdraw</p>
          </CardContent>
        </Card>
        <Card className="bg-dark-card border-gray-800 cursor-pointer hover:bg-dark-lighter transition-colors">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <ArrowUpRight className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
            </div>
            <p className="text-xs sm:text-sm text-gray-300">Send Money</p>
          </CardContent>
        </Card>
        <Card className="bg-dark-card border-gray-800 cursor-pointer hover:bg-dark-lighter transition-colors">
          <CardContent className="p-3 sm:p-4 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <ArrowDownLeft className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
            </div>
            <p className="text-xs sm:text-sm text-gray-300">Request</p>
          </CardContent>        </Card>
      </div>      {/* Transaction History - Mobile responsive */}
      <Card className="bg-dark-card border-gray-800">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {loading ? (
            <div className="text-center py-6 sm:py-8">
              <p className="text-gray-400">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <WalletIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <p className="text-gray-400 mb-2">No transactions yet</p>
              <p className="text-sm text-gray-500">
                Your transaction history will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 sm:p-4 bg-dark-lighter rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getTransactionBgColor(transaction.type)}`}
                    >
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base truncate">{transaction.description}</p>
                      <p className="text-xs sm:text-sm text-gray-400 truncate">
                        {new Date(transaction.createdAt).toLocaleDateString()} •{" "}
                        {transaction.paymentMethod || 'System'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p
                      className={`font-semibold text-sm sm:text-base ${getTransactionTextColor(transaction.type)}`}
                    >
                      {getTransactionSign(transaction.type)}
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </p>
                    <div className="flex items-center gap-1 sm:gap-2 mt-1 justify-end">
                      {getStatusIcon(transaction.status)}
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusColor(
                          transaction.status
                        )}`}
                      >
                        {transaction.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>      {/* Add Money Modal - Mobile responsive */}
      <Dialog open={showAddMoney} onOpenChange={setShowAddMoney}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto p-0 gap-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Add Money to Wallet</DialogTitle>
            <DialogDescription>
              {isManualDeposit
                ? (paymentLink
                  ? (<span>Add money to your wallet using the <a href={paymentLink} target="_blank" rel="noopener noreferrer" className="underline text-blue-400">payment link</a> and upload your payment details.</span>)
                  : "Loading payment link...")
                : "Add money to your wallet using UPI payment"}
            </DialogDescription>
          </DialogHeader>
          {isManualDeposit ? (
            <AddMoney
              onClose={() => setShowAddMoney(false)}
              onSuccess={() => {
                setShowAddMoney(false);
                refreshTransactions();
              }}
              manualDeposit
              paymentLink={paymentLink}
              currency={manualDepositCurrency}
            />
          ) : (
            <UPIAddMoney
              onClose={() => setShowAddMoney(false)}
              onSuccess={() => {
                setShowAddMoney(false);
                refreshTransactions();
              }}
            />
          )}
        </DialogContent>
      </Dialog>      {/* Withdraw Money Modal - Mobile responsive */}
      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
        <DialogContent className="w-[95vw] max-w-md max-h-[95vh] overflow-y-auto p-0 gap-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Withdraw Money from Wallet</DialogTitle>
            <DialogDescription>Withdraw money from your wallet to your bank account</DialogDescription>
          </DialogHeader>
          <WithdrawMoney
            onClose={() => setShowWithdraw(false)}
          />
        </DialogContent>
      </Dialog>

      {}
    </div>
  );
};

export default Wallet;
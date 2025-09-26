import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wallet, CreditCard, ArrowUp, ArrowDown, Plus, Eye, EyeOff, Copy, QrCode, Key } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { PixPaymentResponse } from '@/config/abacatepay';
import * as Clipboard from 'expo-clipboard';

export default function WalletScreen() {
  const { 
    balance, 
    transactions, 
    pixKey, 
    isLoading, 
    updatePixKey, 
    createDeposit, 
    createWithdrawal,
  } = useWallet();
  
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showPixKeyModal, setShowPixKeyModal] = useState(false);
  const [showPixPayment, setShowPixPayment] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [newPixKey, setNewPixKey] = useState(pixKey);
  const [currentPayment, setCurrentPayment] = useState<PixPaymentResponse | null>(null);

  useEffect(() => {
    // Payment status checking will be handled by webhooks
  }, [transactions]);

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 1) {
      Alert.alert('Erro', 'Digite um valor válido (mínimo R$ 1,00)');
      return;
    }

    const payment = await createDeposit(amount);
    if (payment) {
      setCurrentPayment(payment);
      setShowDepositModal(false);
      setShowPixPayment(true);
      setDepositAmount('');
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 1) {
      Alert.alert('Erro', 'Digite um valor válido (mínimo R$ 1,00)');
      return;
    }

    const success = await createWithdrawal(amount);
    if (success) {
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      Alert.alert('Sucesso!', 'Saque solicitado com sucesso! O valor será processado em até 24 horas.');
    }
  };

  const handleUpdatePixKey = () => {
    if (!newPixKey.trim()) {
      Alert.alert('Erro', 'Digite uma chave PIX válida');
      return;
    }
    updatePixKey(newPixKey.trim());
    setShowPixKeyModal(false);
    Alert.alert('Sucesso!', 'Chave PIX atualizada com sucesso!');
  };

  const copyPixCode = async () => {
    if (currentPayment?.pix_code) {
      await Clipboard.setStringAsync(currentPayment.pix_code);
      Alert.alert('Copiado!', 'Código PIX copiado para a área de transferência');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDown size={20} color="#FFFFFF" />;
      case 'withdrawal':
        return <ArrowUp size={20} color="#FFFFFF" />;
      case 'bet_win':
        return <ArrowDown size={20} color="#FFFFFF" />;
      case 'bet_loss':
        return <ArrowUp size={20} color="#FFFFFF" />;
      default:
        return <ArrowUp size={20} color="#FFFFFF" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'bet_win':
        return '#22C55E';
      case 'withdrawal':
      case 'bet_loss':
      case 'team_payment':
      case 'goalkeeper_payment':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Carteira</Text>
          <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)}>
            {balanceVisible ? (
              <Eye size={24} color="#6B7280" />
            ) : (
              <EyeOff size={24} color="#6B7280" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo disponível</Text>
          <Text style={styles.balanceAmount}>
            {balanceVisible ? formatCurrency(balance) : '••••••'}
          </Text>
          
          <View style={styles.balanceActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setShowDepositModal(true)}
              disabled={isLoading}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Depositar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.withdrawButton]}
              onPress={() => setShowWithdrawModal(true)}
              disabled={isLoading || balance < 1}
            >
              <ArrowUp size={20} color="#374151" />
              <Text style={[styles.actionButtonText, styles.withdrawButtonText]}>Sacar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => setShowPixKeyModal(true)}
          >
            <Key size={24} color="#3B82F6" />
            <Text style={styles.quickActionText}>Chave PIX</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <Wallet size={24} color="#10B981" />
            <Text style={styles.quickActionText}>Extrato</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction}>
            <CreditCard size={24} color="#F59E0B" />
            <Text style={styles.quickActionText}>Cartões</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Últimas transações</Text>
          
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Wallet size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>Nenhuma transação ainda</Text>
              <Text style={styles.emptyStateSubtext}>Faça seu primeiro depósito para começar</Text>
            </View>
          ) : (
            transactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={[
                  styles.transactionIcon,
                  { backgroundColor: getTransactionColor(transaction.type) }
                ]}>
                  {getTransactionIcon(transaction.type)}
                </View>
                
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionTitle}>{transaction.description}</Text>
                  <Text style={styles.transactionDate}>{formatDate(transaction.created_at)}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: transaction.status === 'completed' ? '#DCFCE7' : '#FEF3C7' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: transaction.status === 'completed' ? '#166534' : '#92400E' }
                    ]}>
                      {transaction.status === 'completed' ? 'Concluído' : 
                       transaction.status === 'pending' ? 'Pendente' : 'Falhou'}
                    </Text>
                  </View>
                </View>
                
                <Text style={[
                  styles.transactionAmount,
                  { color: getTransactionColor(transaction.type) }
                ]}>
                  {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Deposit Modal */}
      <Modal visible={showDepositModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Depositar via PIX</Text>
            <Text style={styles.modalSubtitle}>Digite o valor que deseja depositar</Text>
            
            <TextInput
              style={styles.modalInput}
              value={depositAmount}
              onChangeText={setDepositAmount}
              placeholder="0,00"
              keyboardType="numeric"
              autoFocus
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowDepositModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirmButton}
                onPress={handleDeposit}
                disabled={isLoading}
              >
                <Text style={styles.modalConfirmText}>
                  {isLoading ? 'Gerando...' : 'Gerar PIX'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Withdraw Modal */}
      <Modal visible={showWithdrawModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sacar via PIX</Text>
            <Text style={styles.modalSubtitle}>
              Saldo disponível: {formatCurrency(balance)}
            </Text>
            
            {!pixKey && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ⚠️ Cadastre sua chave PIX antes de sacar
                </Text>
              </View>
            )}
            
            <TextInput
              style={styles.modalInput}
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              placeholder="0,00"
              keyboardType="numeric"
              autoFocus
              editable={!!pixKey}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowWithdrawModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.modalConfirmButton,
                  (!pixKey || isLoading) && styles.modalConfirmButtonDisabled
                ]}
                onPress={handleWithdraw}
                disabled={!pixKey || isLoading}
              >
                <Text style={styles.modalConfirmText}>
                  {isLoading ? 'Processando...' : 'Sacar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* PIX Key Modal */}
      <Modal visible={showPixKeyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chave PIX</Text>
            <Text style={styles.modalSubtitle}>
              {pixKey ? 'Atualizar chave PIX' : 'Cadastrar chave PIX'}
            </Text>
            
            <TextInput
              style={styles.modalInput}
              value={newPixKey}
              onChangeText={setNewPixKey}
              placeholder="Digite sua chave PIX (CPF, email, telefone ou chave aleatória)"
              autoFocus
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowPixKeyModal(false);
                  setNewPixKey(pixKey);
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirmButton}
                onPress={handleUpdatePixKey}
              >
                <Text style={styles.modalConfirmText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* PIX Payment Modal */}
      <Modal visible={showPixPayment} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pagamento PIX</Text>
            <Text style={styles.modalSubtitle}>
              Valor: {currentPayment ? formatCurrency(currentPayment.amount) : ''}
            </Text>
            
            {currentPayment?.pix_qr_code && (
              <Image 
                source={{ uri: `data:image/png;base64,${currentPayment.pix_qr_code}` }}
                style={styles.qrCode}
              />
            )}
            
            <Text style={styles.pixInstructions}>
              1. Abra o app do seu banco
              2. Escaneie o QR Code acima ou copie o código PIX
              3. Confirme o pagamento
            </Text>
            
            <TouchableOpacity style={styles.copyButton} onPress={copyPixCode}>
              <Copy size={20} color="#FFFFFF" />
              <Text style={styles.copyButtonText}>Copiar código PIX</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalCancelButton}
              onPress={() => {
                setShowPixPayment(false);
                setCurrentPayment(null);
              }}
            >
              <Text style={styles.modalCancelText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
  },
  balanceCard: {
    marginHorizontal: 24,
    backgroundColor: '#1F2937',
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  withdrawButton: {
    backgroundColor: '#F3F4F6',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  withdrawButtonText: {
    color: '#374151',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 24,
  },
  quickAction: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
  },
  section: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  bottomPadding: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
  },
  qrCode: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    marginBottom: 16,
  },
  pixInstructions: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  copyButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
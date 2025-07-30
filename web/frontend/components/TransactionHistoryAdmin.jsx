// web/frontend/components/TransactionHistoryAdmin.jsx
import { useState, useEffect } from 'react';
import {
  Card,
  Layout,
  Heading,
  DataTable,
  Badge,
  Button,
  TextField,
  Select,
  Filters,
  Pagination,
  Spinner,
  EmptyState,
  ButtonGroup,
  Modal,
  TextContainer,
} from '@shopify/polaris';
import config from '../config/index.js';

const TransactionHistoryAdmin = ({ shopDomain }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    type: '',
    dateRange: '30',
    customer: '',
    minPoints: '',
    maxPoints: ''
  });

  // Fetch transactions
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      console.log('📋 Fetching transactions...');
      const queryParams = new URLSearchParams({
        shop: shopDomain,
        page: currentPage,
        limit: 25,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      });
      
      const response = await fetch(`${config.API_BASE_URL}/api/points/transactions/all?${queryParams}`);
      console.log('📊 Transactions response status:', response.status);
      
      const data = await response.json();
      
      if (response.ok) {
        setTransactions(data.transactions);
        setTotalPages(data.pagination.pages);
        setTotalItems(data.pagination.total);
      } else {
        console.error('Transactions API error:', data);
      }
    } catch (error) {
      console.error('❌ Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shopDomain) {
      fetchTransactions();
    }
  }, [shopDomain, currentPage, filters]);

  // Filter options
  const typeOptions = [
    { label: 'All Types', value: '' },
    { label: 'Points Earned', value: 'earned' },
    { label: 'Points Redeemed', value: 'redeemed' },
    { label: 'Spin Reward', value: 'spin_reward' },
    { label: 'Admin Adjustment', value: 'adjustment' },
  ];

  const dateRangeOptions = [
    { label: 'Last 7 days', value: '7' },
    { label: 'Last 30 days', value: '30' },
    { label: 'Last 90 days', value: '90' },
    { label: 'All time', value: '' },
  ];

  // Export to CSV
  const exportToCSV = async () => {
    try {
      const queryParams = new URLSearchParams({
        shop: shopDomain,
        export: 'csv',
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      });
      
      const response = await fetch(`${config.API_BASE_URL}/api/points/transactions/export?${queryParams}`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ Error exporting transactions:', error);
    }
  };

  // Get badge status for transaction type
  const getBadgeStatus = (type, points) => {
    switch (type) {
      case 'earned':
        return 'success';
      case 'redeemed':
        return 'warning';
      case 'spin_reward':
        return 'info';
      case 'adjustment':
        return points > 0 ? 'success' : 'critical';
      default:
        return 'info';
    }
  };

  // Format transaction rows for table
  const transactionRows = transactions.map((transaction) => [
    new Date(transaction.createdAt).toLocaleString(),
    transaction.customerEmail || 'Unknown',
    transaction.description,
    <Badge 
      key={transaction._id} 
      status={getBadgeStatus(transaction.type, transaction.points)}
    >
      {transaction.type.replace('_', ' ')}
    </Badge>,
    <span 
      key={transaction._id}
      style={{ 
        color: transaction.points > 0 ? '#008060' : '#bf0711',
        fontWeight: 'bold'
      }}
    >
      {transaction.points > 0 ? '+' : ''}{transaction.points.toLocaleString()}
    </span>,
    transaction.balanceAfter.toLocaleString(),
    transaction.orderId || transaction.discountCode || '-',
    <ButtonGroup key={transaction._id}>
      <Button 
        size="slim" 
        onClick={() => {
          setSelectedTransaction(transaction);
          setShowDetailsModal(true);
        }}
      >
        Details
      </Button>
    </ButtonGroup>
  ]);

  const appliedFilters = [];
  
  if (filters.type) {
    appliedFilters.push({
      key: 'type',
      label: `Type: ${typeOptions.find(opt => opt.value === filters.type)?.label}`,
      onRemove: () => setFilters({ ...filters, type: '' })
    });
  }
  
  if (filters.dateRange) {
    appliedFilters.push({
      key: 'dateRange',
      label: `Date: ${dateRangeOptions.find(opt => opt.value === filters.dateRange)?.label}`,
      onRemove: () => setFilters({ ...filters, dateRange: '' })
    });
  }
  
  if (filters.customer) {
    appliedFilters.push({
      key: 'customer',
      label: `Customer: ${filters.customer}`,
      onRemove: () => setFilters({ ...filters, customer: '' })
    });
  }

  return (
    <Layout>
      <Layout.Section>
        <Card>
          <Card.Section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Heading element="h2">Transaction History</Heading>
              <Button onClick={exportToCSV}>Export CSV</Button>
            </div>
          </Card.Section>

          <Card.Section>
            <Filters
              queryValue={filters.customer}
              queryPlaceholder="Search by customer email"
              onQueryChange={(value) => setFilters({ ...filters, customer: value })}
              onQueryClear={() => setFilters({ ...filters, customer: '' })}
              filters={[
                {
                  key: 'type',
                  label: 'Transaction Type',
                  filter: (
                    <Select
                      options={typeOptions}
                      value={filters.type}
                      onChange={(value) => setFilters({ ...filters, type: value })}
                    />
                  )
                },
                {
                  key: 'dateRange',
                  label: 'Date Range',
                  filter: (
                    <Select
                      options={dateRangeOptions}
                      value={filters.dateRange}
                      onChange={(value) => setFilters({ ...filters, dateRange: value })}
                    />
                  )
                }
              ]}
              appliedFilters={appliedFilters}
              onClearAll={() => setFilters({
                type: '',
                dateRange: '30',
                customer: '',
                minPoints: '',
                maxPoints: ''
              })}
            />
          </Card.Section>

          {loading ? (
            <Card.Section>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <Spinner size="large" />
                <p>Loading transactions...</p>
              </div>
            </Card.Section>
          ) : transactions.length > 0 ? (
            <>
              <DataTable
                columnContentTypes={[
                  'text',    // Date
                  'text',    // Customer
                  'text',    // Description
                  'text',    // Type (Badge)
                  'text',    // Points
                  'numeric', // Balance After
                  'text',    // Reference
                  'text',    // Actions
                ]}
                headings={[
                  'Date',
                  'Customer',
                  'Description',
                  'Type',
                  'Points',
                  'Balance After',
                  'Reference',
                  'Actions'
                ]}
                rows={transactionRows}
              />
              
              <Card.Section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p>Showing {transactions.length} of {totalItems.toLocaleString()} transactions</p>
                  
                  {totalPages > 1 && (
                    <Pagination
                      label={`Page ${currentPage} of ${totalPages}`}
                      hasPrevious={currentPage > 1}
                      onPrevious={() => setCurrentPage(currentPage - 1)}
                      hasNext={currentPage < totalPages}
                      onNext={() => setCurrentPage(currentPage + 1)}
                    />
                  )}
                </div>
              </Card.Section>
            </>
          ) : (
            <EmptyState
              heading="No transactions found"
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>No transactions match your current filters. Try adjusting your search criteria.</p>
            </EmptyState>
          )}
        </Card>
      </Layout.Section>

      {/* Transaction Details Modal */}
      <Modal
        open={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Transaction Details"
        secondaryActions={[{
          content: 'Close',
          onAction: () => setShowDetailsModal(false)
        }]}
      >
        <Modal.Section>
          {selectedTransaction && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <TextContainer>
                <p><strong>Date:</strong> {new Date(selectedTransaction.createdAt).toLocaleString()}</p>
                <p><strong>Customer:</strong> {selectedTransaction.customerEmail || 'Unknown'}</p>
                <p><strong>Type:</strong> {selectedTransaction.type.replace('_', ' ')}</p>
                <p><strong>Description:</strong> {selectedTransaction.description}</p>
              </TextContainer>
              
              <TextContainer>
                <p><strong>Points:</strong> {selectedTransaction.points > 0 ? '+' : ''}{selectedTransaction.points.toLocaleString()}</p>
                <p><strong>Balance After:</strong> {selectedTransaction.balanceAfter.toLocaleString()}</p>
                <p><strong>Order ID:</strong> {selectedTransaction.orderId || 'N/A'}</p>
                <p><strong>Discount Code:</strong> {selectedTransaction.discountCode || 'N/A'}</p>
              </TextContainer>
              
              {selectedTransaction.metadata && Object.keys(selectedTransaction.metadata).length > 0 && (
                <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                  <p><strong>Additional Details:</strong></p>
                  <pre style={{ 
                    backgroundColor: '#f6f6f7', 
                    padding: '1rem', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    overflow: 'auto'
                  }}>
                    {JSON.stringify(selectedTransaction.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </Modal.Section>
      </Modal>
    </Layout>
  );
};

export default TransactionHistoryAdmin;
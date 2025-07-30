// web/frontend/components/SpinWheelConfig.jsx
import { useState, useEffect } from 'react';
import {
  Card,
  Layout,
  Heading,
  Button,
  DataTable,
  Modal,
  FormLayout,
  TextField,
  Select,
  Banner,
  ButtonGroup,
  Badge,
  Spinner,
  EmptyState,
} from '@shopify/polaris';
import config from '../config/index.js';

const SpinWheelConfig = ({ shopDomain }) => {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [formData, setFormData] = useState({
    type: 'points',
    value: '',
    label: '',
    probability: '',
    color: '#3b82f6'
  });

  // Fetch current spin wheel configuration
  const fetchSpinWheelConfig = async () => {
    try {
      console.log('🎰 Fetching spin wheel config...');
      const response = await fetch(`${config.API_BASE_URL}/api/spin/config?shop=${shopDomain}`);
      console.log('📊 Config response status:', response.status);
      
      const data = await response.json();
      
      if (response.ok) {
        setRewards(data.rewards || []);
      } else {
        console.error('Config API error:', data);
      }
    } catch (error) {
      console.error('❌ Error fetching spin wheel config:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shopDomain) {
      fetchSpinWheelConfig();
    }
  }, [shopDomain]);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const url = editingReward 
        ? `${config.API_BASE_URL}/api/spin/config/reward/${editingReward.id}` 
        : `${config.API_BASE_URL}/api/spin/config/reward`;
      
      const method = editingReward ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          shopDomain,
          value: parseFloat(formData.value),
          probability: parseFloat(formData.probability)
        })
      });

      if (response.ok) {
        setShowAddModal(false);
        setEditingReward(null);
        setFormData({
          type: 'points',
          value: '',
          label: '',
          probability: '',
          color: '#3b82f6'
        });
        fetchSpinWheelConfig(); // Refresh data
      }
    } catch (error) {
      console.error('❌ Error saving reward:', error);
    }
  };

  // Delete reward
  const handleDelete = async (rewardId) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/spin/config/reward/${rewardId}?shop=${shopDomain}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchSpinWheelConfig(); // Refresh data
      }
    } catch (error) {
      console.error('❌ Error deleting reward:', error);
    }
  };

  // Edit reward
  const handleEdit = (reward) => {
    setEditingReward(reward);
    setFormData({
      type: reward.type,
      value: reward.value.toString(),
      label: reward.label,
      probability: reward.probability.toString(),
      color: reward.color
    });
    setShowAddModal(true);
  };

  // Type options
  const typeOptions = [
    { label: 'Points', value: 'points' },
    { label: 'Percentage Discount', value: 'discount_percentage' },
    { label: 'Fixed Discount', value: 'discount_fixed' },
    { label: 'Free Shipping', value: 'free_shipping' },
  ];

  // Color options
  const colorOptions = [
    { label: 'Blue', value: '#3b82f6' },
    { label: 'Green', value: '#10b981' },
    { label: 'Yellow', value: '#f59e0b' },
    { label: 'Red', value: '#ef4444' },
    { label: 'Purple', value: '#8b5cf6' },
    { label: 'Pink', value: '#ec4899' },
    { label: 'Gray', value: '#6b7280' },
  ];

  // Format rewards for table
  const rewardRows = rewards.map((reward) => [
    reward.label,
    <Badge key={reward.id} status="info">{reward.type.replace('_', ' ')}</Badge>,
    reward.type === 'points' ? `${reward.value} points` : 
    reward.type === 'discount_percentage' ? `${reward.value}%` :
    reward.type === 'discount_fixed' ? `₹${reward.value}` : 'Free Shipping',
    `${reward.probability}%`,
    <div key={reward.id} style={{ 
      width: '20px', 
      height: '20px', 
      backgroundColor: reward.color, 
      borderRadius: '3px',
      display: 'inline-block'
    }} />,
    <ButtonGroup key={reward.id}>
      <Button size="slim" onClick={() => handleEdit(reward)}>Edit</Button>
      <Button size="slim" destructive onClick={() => handleDelete(reward.id)}>Delete</Button>
    </ButtonGroup>
  ]);

  // Calculate total probability
  const totalProbability = rewards.reduce((sum, reward) => sum + reward.probability, 0);

  if (loading) {
    return (
      <Card sectioned>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Spinner size="large" />
          <p>Loading spin wheel configuration...</p>
        </div>
      </Card>
    );
  }

  return (
    <Layout>
      <Layout.Section>
        <Card>
          <Card.Section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Heading element="h2">Spin Wheel Configuration</Heading>
              <Button primary onClick={() => setShowAddModal(true)}>
                Add Reward
              </Button>
            </div>
          </Card.Section>

          {totalProbability !== 100 && rewards.length > 0 && (
            <Card.Section>
              <Banner status={totalProbability > 100 ? 'critical' : 'warning'}>
                <p>Total probability is {totalProbability}%. It should equal 100% for proper wheel balance.</p>
              </Banner>
            </Card.Section>
          )}

          {rewards.length > 0 ? (
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text']}
              headings={['Label', 'Type', 'Value', 'Probability', 'Color', 'Actions']}
              rows={rewardRows}
            />
          ) : (
            <Card.Section>
              <EmptyState
                heading="No rewards configured"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>Add rewards to configure your spin wheel. Customers will spin for these prizes daily.</p>
                <Button primary onClick={() => setShowAddModal(true)}>
                  Add Your First Reward
                </Button>
              </EmptyState>
            </Card.Section>
          )}
        </Card>
      </Layout.Section>

      {/* Add/Edit Reward Modal */}
      <Modal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingReward(null);
          setFormData({
            type: 'points',
            value: '',
            label: '',
            probability: '',
            color: '#3b82f6'
          });
        }}
        title={editingReward ? 'Edit Reward' : 'Add New Reward'}
        primaryAction={{
          content: editingReward ? 'Update Reward' : 'Add Reward',
          onAction: handleSubmit,
          disabled: !formData.label || !formData.value || !formData.probability
        }}
        secondaryActions={[{
          content: 'Cancel',
          onAction: () => {
            setShowAddModal(false);
            setEditingReward(null);
          }
        }]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField
              label="Reward Label"
              value={formData.label}
              onChange={(value) => setFormData({ ...formData, label: value })}
              placeholder="e.g., 50 Points, 10% Off"
              helpText="This text will appear on the spin wheel"
            />

            <Select
              label="Reward Type"
              options={typeOptions}
              value={formData.type}
              onChange={(value) => setFormData({ ...formData, type: value })}
            />

            <TextField
              label="Value"
              type="number"
              value={formData.value}
              onChange={(value) => setFormData({ ...formData, value })}
              placeholder={
                formData.type === 'points' ? '50' :
                formData.type === 'discount_percentage' ? '10' :
                formData.type === 'discount_fixed' ? '100' : '1'
              }
              helpText={
                formData.type === 'points' ? 'Number of points to award' :
                formData.type === 'discount_percentage' ? 'Percentage discount (without % sign)' :
                formData.type === 'discount_fixed' ? 'Fixed discount amount in rupees' :
                'Enter 1 for free shipping'
              }
            />

            <TextField
              label="Probability (%)"
              type="number"
              value={formData.probability}
              onChange={(value) => setFormData({ ...formData, probability: value })}
              placeholder="25"
              helpText="Chance of winning this reward (all probabilities should sum to 100%)"
              min="0.1"
              max="100"
              step="0.1"
            />

            <Select
              label="Color"
              options={colorOptions}
              value={formData.color}
              onChange={(value) => setFormData({ ...formData, color: value })}
            />

            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f6f6f7', borderRadius: '4px' }}>
              <p><strong>Preview:</strong></p>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '8px'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: formData.color,
                  borderRadius: '3px'
                }} />
                <span>{formData.label || 'Reward Label'}</span>
              </div>
            </div>
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Layout>
  );
};

export default SpinWheelConfig;
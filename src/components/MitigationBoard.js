import React, { useMemo, useState, useEffect } from 'react';
import styled from 'styled-components';
import NavigationBar from './NavigationBar';
import { PageLayout } from './PageLayout';
import { getCases, getClosedCases, createCase, updateCaseStatus, updateCase, closeCase, getComments, addComment } from '../services/mitigationService';

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: #F7F9FB;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  gap: 24px;
  padding: 20px;
  max-width: 1680px;
  margin: 0 auto;
  width: 100%;

  @media (max-width: 768px) {
    padding: 16px;
    gap: 16px;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: #333333;
  margin: 0;
`;

const TopBar = styled.div`
  background: white;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  border: 1px solid rgba(0,0,0,0.05);
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
`;

const Search = styled.input`
  padding: 10px 12px;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  flex: 1;
  min-width: 220px;

  &:focus { border-color: #1A4B8F; box-shadow: 0 0 0 3px rgba(26,75,143,0.1); }
  &::placeholder { color: #9ca3af; }
`;

const Select = styled.select`
  padding: 10px 12px;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  color: #333333;
`;

const AddButton = styled.button`
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  background: #1A4B8F;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
`;

const ClosedButton = styled.button`
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  background: #f1f3f4;
  color: #333333;
  font-weight: 600;
  cursor: pointer;
`;

const Board = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Column = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.05);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  max-height: 70vh;
`;

const ColumnHeader = styled.div`
  padding: 12px 14px;
  border-bottom: 1px solid #eef1f4;
  font-weight: 700;
  color: #1A4B8F;
`;

const ColumnBody = styled.div`
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Card = styled.div`
  position: relative;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  cursor: pointer;
`;

const CloseIcon = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: transparent;
  border: none;
  color: #999;
  cursor: pointer;
`;

const NotificationDot = styled.span`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e74c3c;
`;

// Removed cause badge from card top-left per latest requirement

const CardTitle = styled.div`
  font-weight: 800;
  color: #333;
`;

const CardSub = styled.div`
  font-size: 12px;
  color: #666;
`;

const Badge = styled.span`
  font-size: 12px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 999px;
  color: ${p => p.severity === 'major' ? '#991B1B' : p.severity === 'moderate' ? '#92400E' : '#166534'};
  background: ${p => p.severity === 'major' ? '#FEE2E2' : p.severity === 'moderate' ? '#FEF3C7' : '#DCFCE7'};
`;

const Tag = styled.span`
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 999px;
  background: #eef2ff;
  color: #1A4B8F;
`;

const Assignee = styled.span`
  font-size: 12px;
  color: #333;
  font-weight: 700;
`;

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalCard = styled.div`
  background: #fff;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 10px 30px rgba(0,0,0,0.12);
  padding: 20px;
  max-width: 420px;
  width: 100%;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 14px;
`;

const Button = styled.button`
  padding: 10px 14px;
  border-radius: 8px;
  border: none;
  font-weight: 700;
  cursor: pointer;
  ${p => p.primary ? 'background:#1A4B8F;color:#fff;' : 'background:#f1f3f4;color:#333;'}
`;

const Drawer = styled.div`
  position: fixed;
  top: 64px;
  right: ${p => p.open ? '0' : '-420px'};
  width: 420px;
  height: calc(100vh - 64px);
  background: #fff;
  border-left: 1px solid rgba(0,0,0,0.06);
  box-shadow: -6px 0 24px rgba(0,0,0,0.08);
  transition: right 0.25s ease;
  z-index: 999;
  display: flex;
  flex-direction: column;
`;

const DrawerBody = styled.div`
  padding: 20px;
  overflow: auto;
  flex: 1;
`;

const DrawerSection = styled.div`
  margin-bottom: 16px;
`;

const CauseButton = styled.button`
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid #e1e5e9;
  background: ${p => p.active ? '#1A4B8F' : '#fff'};
  color: ${p => p.active ? '#fff' : '#333'};
  font-weight: 600;
  cursor: pointer;
`;

const Pill = styled.span`
  padding: 6px 10px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #1A4B8F;
  font-size: 12px;
  font-weight: 700;
`;

const initialCases = []; // Will be populated from API

// Mock flights list for selector (subset representative of system flights)
const flightsCatalog = [
  { flightNo: 'LH4421', airline: 'Lufthansa', route: 'MUC → FRA', scheduledTime: '14:30', predictedDelay: 2, delayDuration: '2 min', likelyCause: 'Weather', status: 'On-Time' },
  { flightNo: 'AF1825', airline: 'Air France', route: 'CDG → MUC', scheduledTime: '15:45', predictedDelay: 15, delayDuration: '15 min', likelyCause: 'Congestion', status: 'Minor Delay' },
  { flightNo: 'BA952', airline: 'British Airways', route: 'LHR → MUC', scheduledTime: '16:20', predictedDelay: 42, delayDuration: '42 min', likelyCause: 'Reactionary', status: 'Major Delay' },
  { flightNo: 'KL1856', airline: 'KLM Royal Dutch', route: 'AMS → MUC', scheduledTime: '17:10', predictedDelay: 0, delayDuration: 'On Time', likelyCause: 'Weather', status: 'On-Time' },
  { flightNo: 'EW7823', airline: 'Eurowings', route: 'VIE → MUC', scheduledTime: '17:35', predictedDelay: 12, delayDuration: '12 min', likelyCause: 'Congestion', status: 'Minor Delay' },
  { flightNo: 'SN789', airline: 'Brussels Airlines', route: 'BRU → MUC', scheduledTime: '19:15', predictedDelay: 75, delayDuration: '75 min', likelyCause: 'Reactionary', status: 'Major Delay' },
];

const MitigationBoard = ({ userRole = 'APOC', userName, onLogout, activeTab, onTabChange,
  notifCount = 0, hasNewNotif = false, notifOpen = false, liveAlerts = [], onNotifClick, onNotifClose,
  onAlertDismiss, onAlertAddToBoard
}) => {
  const [query, setQuery] = useState('');
  const [filterAirline, setFilterAirline] = useState('All');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(null);
  const [pendingMove, setPendingMove] = useState(null);
  const [drawerCase, setDrawerCase] = useState(null);
  const [drawerMode, setDrawerMode] = useState('view'); // 'view' | 'create'
  const [flightQuery, setFlightQuery] = useState('');
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [createTags, setCreateTags] = useState(new Set());
  const [otherCause, setOtherCause] = useState('');
  const [commentExpand, setCommentExpand] = useState(false);
  const [comments, setComments] = useState([]);
  const [deadline, setDeadline] = useState('');
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);
  const [closedCases, setClosedCases] = useState([]);
  const [showClosed, setShowClosed] = useState(false);
  const [cardNotifications, setCardNotifications] = useState(new Set());

  // Load cases from API on mount
  useEffect(() => {
    const loadBoard = async () => {
      setLoading(true);
      try {
        const [activeCasesResp, closedCasesResp] = await Promise.all([
          getCases().catch(() => ({ cases: [] })),
          getClosedCases().catch(() => ({ cases: [] }))
        ]);
        setCases(activeCasesResp.cases || []);
        setClosedCases(closedCasesResp.cases || []);
      } catch (error) {
        console.error('Error loading mitigation board:', error);
      } finally {
        setLoading(false);
      }
    };
    loadBoard();
  }, []);

  const handleCreateTagEnter = (e) => {
    if (e.key === 'Enter') {
      const val = (e.target.value || '').trim();
      if (!val) return;
      setCreateTags(prev => new Set([...Array.from(prev), val]));
      e.target.value = '';
    }
  };

  const handleViewTagEnter = (e, base) => {
    if (e.key === 'Enter') {
      const val = (e.target.value || '').trim();
      if (!val) return;
      setCases(prev => prev.map(c => c.id === base.id ? { ...c, tags: [...new Set([...(c.tags || []), val])] } : c));
      // Add notification for tag update
      setCardNotifications(prev => new Set(prev).add(base.id));
      e.target.value = '';
    }
  };

  const canEdit = userRole === 'APOC' || userRole === 'AOC';
  const canReassign = userRole === 'Admin';

  // Map API status to UI column key
  const statusToColumn = {
    'delayNoted': 'identified',
    'inProgress': 'inprogress',
    'verified': 'verified',
    'resolved': 'resolved',
    'closed': 'closed'
  };

  const columnToStatus = {
    'identified': 'delayNoted',
    'inprogress': 'inProgress',
    'verified': 'verified',
    'resolved': 'resolved',
    'closed': 'closed'
  };

  // Normalize cases from API to UI format
  const normalizedCases = cases.map(c => ({
    ...c,
    column: statusToColumn[c.status] || 'identified',
    severity: c.risk_level === 'high' ? 'major' : c.risk_level === 'medium' ? 'moderate' : 'minor',
    cause: c.likely_cause || 'Unknown',
    route: c.route || '—',
    delayMin: c.predicted_delay_min || 0,
    flightNo: c.flight_number,
    airline: c.airline_code || '—',
    unseen: false // API doesn't track this, assume not unseen
  }));

  const filtered = useMemo(() => {
    return normalizedCases.filter(c =>
      (query === '' || c.flightNo.toLowerCase().includes(query.toLowerCase()) || c.airline.toLowerCase().includes(query.toLowerCase())) &&
      (filterAirline === 'All' || c.airline === filterAirline) &&
      (filterSeverity === 'All' || c.severity === filterSeverity)
    );
  }, [normalizedCases, query, filterAirline, filterSeverity]);

  const columns = [
    { key: 'identified', title: 'Delay Noted' },
    { key: 'inprogress', title: 'In Progress' },
    { key: 'verified', title: 'Verified' },
    { key: 'resolved', title: 'Resolved' },
  ];

  const onDragStart = (e, id) => {
    if (!canEdit) return;
    setDragging(id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e) => {
    if (!canEdit) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onDrop = (e, colKey) => {
    if (!canEdit) return;
    e.preventDefault();
    if (!dragging) return;
    const card = cases.find(c => c.id === dragging);
    if (!card || card.column === colKey) { setDragging(null); return; }
    setPendingMove({ id: dragging, from: card.column, to: colKey });
    setDragging(null);
  };

  const confirmMove = async () => {
    if (!pendingMove) return;
    try {
      // Convert column key to status (identified→delayNoted, inprogress→inProgress, etc.)
      const statusMap = {
        'identified': 'delayNoted',
        'inprogress': 'inProgress',
        'verified': 'verified',
        'resolved': 'resolved'
      };
      await updateCaseStatus(pendingMove.id, statusMap[pendingMove.to] || pendingMove.to);
      setCases(prev => prev.map(c => c.id === pendingMove.id ? { ...c, column: pendingMove.to } : c));
      setCardNotifications(prev => new Set(prev).add(pendingMove.id));
    } catch (error) {
      console.error('Error updating case status:', error);
      alert('Failed to move case. Please try again.');
    }
    setPendingMove(null);
  };
  const cancelMove = () => setPendingMove(null);

  const handleCloseCase = async (c) => {
    if (!canEdit) return;
    try {
      await closeCase(c.id);
      setClosedCases(prev => [{ ...c, closed_at: new Date().toISOString() }, ...prev]);
      setCases(prev => prev.filter(x => x.id !== c.id));
    } catch (error) {
      console.error('Error closing case:', error);
      alert('Failed to close case. Please try again.');
    }
  };

  const openCase = async (c) => {
    setDrawerMode('view');
    setDrawerCase({ ...c, tags: new Set((c.tagged_causes || [])) });
    setCases(prev => prev.map(x => x.id === c.id ? { ...x, unseen: false } : x));
    setCardNotifications(prev => {
      const next = new Set(prev);
      next.delete(c.id);
      return next;
    });
    // Load comments for this case
    try {
      const caseComments = await getComments(c.id);
      setComments(caseComments || []);
    } catch (error) {
      console.warn('Error loading comments:', error);
      setComments([]);
    }
  };

  const toggleTag = (name) => {
    setDrawerCase(prev => {
      if (!prev) return prev;
      const nextTags = new Set(prev.tags);
      if (nextTags.has(name)) nextTags.delete(name); else nextTags.add(name);
      return { ...prev, tags: nextTags };
    });
  };

  const saveTags = async () => {
    if (!drawerCase) return;
    try {
      const tagsArray = Array.from(drawerCase.tags || []);
      await updateCase(drawerCase.id, { tagged_causes: tagsArray });
      setCases(prev => prev.map(c => c.id === drawerCase.id ? { ...c, tagged_causes: tagsArray } : c));
      setCardNotifications(prev => new Set(prev).add(drawerCase.id));
    } catch (error) {
      console.error('Error saving tags:', error);
      alert('Failed to save tags. Please try again.');
    }
  };

  const openCreateDrawer = () => {
    if (!canEdit) return;
    setDrawerMode('create');
    setSelectedFlight(null);
    setFlightQuery('');
    setCreateTags(new Set());
    setOtherCause('');
    setComments([]);
    setDeadline('');
    setDrawerCase({});
  };

  const toggleCreateTag = (name) => {
    setCreateTags(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const addCommentHandler = async (text) => {
    if (!text || !drawerCase) return;
    try {
      const newComment = await addComment(drawerCase.id, text, userName);
      setComments(prev => [...prev, newComment]);
      if (drawerCase && drawerMode === 'view') {
        setCardNotifications(prev => new Set(prev).add(drawerCase.id));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    }
  };

  const severityFromDelay = (min) => {
    if (min >= 30) return 'major';
    if (min >= 12) return 'moderate';
    return 'minor';
  };

  const saveNewCase = async () => {
    if (!selectedFlight) return;
    try {
      const rawTags = Array.from(createTags);
      const primaryCause = rawTags[0] || (selectedFlight.likelyCause || 'Other');
      
      const newCaseData = {
        flight_number: selectedFlight.flightNo,
        sched_utc: selectedFlight.sched_utc || new Date().toISOString(),
        airline_code: selectedFlight.airline?.substring(0, 2) || null,
        route: selectedFlight.route,
        predicted_delay_min: selectedFlight.predictedDelay || 0,
        risk_level: severityFromDelay(selectedFlight.predictedDelay) === 'major' ? 'high' : 'medium',
        likely_cause: selectedFlight.likelyCause || null,
        tagged_causes: rawTags.length > 0 ? rawTags : (selectedFlight.likelyCause ? [selectedFlight.likelyCause] : []),
        deadline: deadline || null
      };

      const newCase = await createCase(newCaseData);
      setCases(prev => [newCase, ...prev]);
      setDrawerCase(null);
      setDrawerMode('view');
      setSelectedFlight(null);
      setCreateTags(new Set());
      setDeadline('');
      setFlightQuery('');
    } catch (error) {
      console.error('Error creating case:', error);
      alert('Failed to create case. Please try again.');
    }
  };

  const getCauseBreakdown = (flight) => {
    if (!flight) return [];
    // Normalize to only Weather, Congestion, Reactionary (merge ATC->Congestion, Ground Ops->Reactionary)
    if (flight.flightNo === 'BA952') {
      // Original: Ground Ops 62, Congestion 25, ATC 13 → Reactionary 62, Congestion 38
      return [
        { label: 'Reactionary', pct: 62 },
        { label: 'Congestion', pct: 38 },
      ];
    }
    if (flight.flightNo === 'AF1825') {
      // Original: ATC 70, Weather 30 → Congestion 70, Weather 30
      return [
        { label: 'Congestion', pct: 70 },
        { label: 'Weather', pct: 30 },
      ];
    }
    const likely = (flight.likelyCause || flight.cause || 'Reactionary').toLowerCase();
    if (likely.includes('weather')) return [{ label: 'Weather', pct: 100 }];
    if (likely.includes('congestion') || likely.includes('traffic') || likely.includes('atc')) return [{ label: 'Congestion', pct: 100 }];
    return [{ label: 'Reactionary', pct: 100 }];
  };

  const causeColor = (label) => {
    switch(label) {
      case 'Weather': return '#1976D2';
      case 'ATC': return '#F57C00';
      case 'Ground Ops': return '#7B1FA2';
      case 'Congestion': return '#D32F2F';
      default: return '#666666';
    }
  };

  const airlines = ['All', ...Array.from(new Set(normalizedCases.map(c => c.airline)))];
  const severities = ['All', 'minor', 'moderate', 'major'];

  return (
    <PageLayout>
    <PageContainer>
      <NavigationBar
        userRole={userRole}
        userName={userName}
        onLogout={onLogout}
        activeTab={activeTab}
        onTabChange={onTabChange}
          notifCount={notifCount}
          hasNewNotif={hasNewNotif}
          notifOpen={notifOpen}
          liveAlerts={liveAlerts || []}
          onNotifClick={onNotifClick}
          onNotifClose={onNotifClose}
          onAlertDismiss={onAlertDismiss}
          onAlertAddToBoard={onAlertAddToBoard}
        />
      <MainContent>
        <ContentArea>
          <HeaderRow>
            <Title>Mitigation Tracker Board</Title>
          </HeaderRow>
          <TopBar>
            <Search placeholder="Search flights or airlines..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <Select value={filterAirline} onChange={(e) => setFilterAirline(e.target.value)}>
              {airlines.map(a => <option key={a} value={a}>{a}</option>)}
            </Select>
            <Select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
              {severities.map(s => <option key={s} value={s}>{s === 'All' ? 'All Severities' : s}</option>)}
            </Select>
            <ClosedButton onClick={() => setShowClosed(true)}>Closed Cases</ClosedButton>
            <AddButton onClick={openCreateDrawer}>+ Add Case</AddButton>
          </TopBar>

          <Board>
            {columns.map(col => (
              <Column key={col.key} onDragOver={onDragOver} onDrop={(e) => onDrop(e, col.key)}>
                <ColumnHeader>{col.title}</ColumnHeader>
                <ColumnBody>
                  {filtered.filter(c => c.column === col.key).map(c => (
                    <Card key={c.id} draggable={canEdit} onDragStart={(e) => onDragStart(e, c.id)} onClick={() => openCase(c)}>
                      {cardNotifications.has(c.id) && <NotificationDot />}
                      <CloseIcon title="Close case" onClick={(e) => { e.stopPropagation(); handleCloseCase(c); }}>✕</CloseIcon>
                      <CardTitle>{c.flightNo}</CardTitle>
                      <CardSub>{c.airline} • {c.route}</CardSub>
                      <div style={{ display:'flex', gap:8, marginTop:8, alignItems:'center' }}>
                        <Badge severity={c.severity}>{c.severity}</Badge>
                        <Tag>{c.cause}</Tag>
                        <Assignee>{c.assignee}</Assignee>
                      </div>
                    </Card>
                  ))}
                </ColumnBody>
              </Column>
            ))}
          </Board>
        </ContentArea>
      </MainContent>

      {showCommentsPanel && (
        <ModalBackdrop onClick={() => setShowCommentsPanel(false)}>
          <ModalCard style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div style={{ fontWeight:800, color:'#333' }}>Chat</div>
              <button style={{ border:'none', background:'transparent', color:'#1A4B8F', cursor:'pointer' }} onClick={() => setShowCommentsPanel(false)}>✕</button>
            </div>
            <div style={{ border:'1px solid #eef1f4', borderRadius:8, display:'flex', flexDirection:'column', height: 420 }}>
              <div style={{ flex:1, overflow:'auto', padding:10, display:'flex', flexDirection:'column', gap:8 }}>
                {comments.map(c => {
                  const isSelf = (c.by || '').toLowerCase() === 'apoc';
                  return (
                    <div
                      key={c.id}
                      style={{
                        alignSelf: isSelf ? 'flex-end' : 'flex-start',
                        background: isSelf ? '#e0f2fe' : '#f8fafc',
                        padding: 10,
                        borderRadius: 8,
                        maxWidth: '75%',
                      }}
                    >
                      <div style={{ color:'#333' }}>{c.text}</div>
                      <div style={{ color:'#666', fontSize:12, marginTop:4 }}>{new Date(c.at).toLocaleString()} • {c.by}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding:10, borderTop:'1px solid #eef1f4', display:'flex', gap:8, alignItems:'center' }}>
                <input style={{ flex:1, padding:'10px 12px', border:'1px solid #e1e5e9', borderRadius:8 }} placeholder="Type a message..." id="panelCommentInput" />
                <button
                  title="Send"
                  style={{ border:'none', background:'#1A4B8F', color:'#fff', width:40, height:40, borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
                  onClick={() => { const input = document.getElementById('panelCommentInput'); if (input && input.value) { addCommentHandler(input.value); input.value=''; }}}
                >
                  ➤
                </button>
              </div>
            </div>
          </ModalCard>
        </ModalBackdrop>
      )}

      {pendingMove && (
        <ModalBackdrop>
          <ModalCard>
            <div style={{ fontWeight:800, color:'#333', marginBottom:8 }}>Confirm Changes</div>
            <div style={{ color:'#333' }}>Move Flight {cases.find(c => c.id === pendingMove.id)?.flightNo} from {columns.find(c => c.key === pendingMove.from)?.title} → {columns.find(c => c.key === pendingMove.to)?.title}?</div>
            <ModalActions>
              <Button onClick={cancelMove}>Cancel</Button>
              <Button primary onClick={confirmMove}>Confirm</Button>
            </ModalActions>
          </ModalCard>
        </ModalBackdrop>
      )}

      <Drawer open={!!drawerCase}>
        {drawerCase && drawerMode === 'view' && (() => {
          const base = cases.find(c => c.id === drawerCase.id) || {};
          const viewTags = new Set(base.tags || []);
          const flightData = flightsCatalog.find(f => f.flightNo === base.flightNo) || base;
          return (
            <DrawerBody>
              <DrawerSection>
                <div style={{ fontWeight:800, color:'#333' }}>{base.flightNo || ''}</div>
                <div style={{ color:'#666', marginTop:4 }}>{base.airline || ''} • {base.route || ''}</div>
                <div style={{ color:'#666', marginTop:6 }}>Scheduled: {flightData.scheduledTime || base.scheduledTime || '--'}</div>
                <div style={{ marginTop:6, display:'flex', gap:8, alignItems:'center' }}>
                  <Badge severity={base.severity || 'minor'}>{base.severity || 'minor'}</Badge>
                  <span style={{ color:'#333' }}>Predicted Delay: {flightData.predictedDelay === 0 ? 'On Time' : `${flightData.predictedDelay || base.delayMin || 0} min`}</span>
                </div>
              </DrawerSection>

              <DrawerSection>
                <div style={{ fontWeight:800, color:'#333', marginBottom:6 }}>Propagation Impact</div>
                {base.flightNo === 'BA952' ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    <div style={{ padding:12, background:'#f8f9fa', borderRadius:8, borderLeft:'3px solid #1A4B8F' }}>
                      <div style={{ fontWeight:600, color:'#1A4B8F' }}>Impacts Flight LH305</div>
                      <div style={{ color:'#666' }}>+22 min delay</div>
                    </div>
                    <div style={{ padding:12, background:'#f8f9fa', borderRadius:8, borderLeft:'3px solid #1A4B8F' }}>
                      <div style={{ fontWeight:600, color:'#1A4B8F' }}>Impacts Flight AF1825</div>
                      <div style={{ color:'#666' }}>+15 min delay</div>
                    </div>
                  </div>
                ) : base.flightNo === 'SN789' ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    <div style={{ padding:12, background:'#f8f9fa', borderRadius:8, borderLeft:'3px solid #1A4B8F' }}>
                      <div style={{ fontWeight:600, color:'#1A4B8F' }}>Impacts Flight EW7823</div>
                      <div style={{ color:'#666' }}>+8 min delay</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ color:'#666' }}>No propagation detected</div>
                )}
              </DrawerSection>

              <DrawerSection>
                <div style={{ fontWeight:800, color:'#333', marginBottom:6 }}>Cause Breakdown</div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {getCauseBreakdown({ flightNo: base.flightNo, likelyCause: base.cause }).map(item => (
                    <div key={item.label} style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ minWidth:110, color:'#333' }}>{item.label}</div>
                      <div style={{ flex:1, height:8, background:'#f1f3f4', borderRadius:4 }}>
                        <div style={{ width:`${item.pct}%`, height:8, background: causeColor(item.label), borderRadius:4 }} />
                      </div>
                      <div style={{ minWidth:40, color:'#333', textAlign:'right' }}>{item.pct}%</div>
                    </div>
                  ))}
                </div>
              </DrawerSection>

              <DrawerSection>
                <div style={{ fontWeight:800, color:'#333', marginBottom:8 }}>Tag Cause</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {['Weather','Traffic','Reactionary','Technical'].map(name => (
                    <CauseButton key={name} active={viewTags.has(name)} onClick={() => { if (canEdit || canReassign) { if (viewTags.has(name)) viewTags.delete(name); else viewTags.add(name); setCases(prev => prev.map(c => c.id === base.id ? { ...c, tags: Array.from(viewTags) } : c)); setCardNotifications(prev => new Set(prev).add(base.id)); } }}>{name} {viewTags.has(name) ? '✓' : ''}</CauseButton>
                  ))}
                </div>
                <div style={{ marginTop:8 }}>
                  <input
                    style={{ padding:'8px 10px', border:'1px solid #e1e5e9', borderRadius:8, width:'100%' }}
                    placeholder="Type a cause and press Enter to tag"
                    onKeyDown={(e) => handleViewTagEnter(e, base)}
                  />
                </div>
                {viewTags.size > 0 && (
                  <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
                    {Array.from(viewTags).map(name => (
                      <span key={name} style={{ position:'relative' }}>
                        <Pill>{name}</Pill>
                        <button
                          title="Remove"
                          style={{ position:'absolute', top:-6, right:-6, border:'none', background:'#e2e8f0', borderRadius:'50%', width:16, height:16, cursor:'pointer', fontSize:10 }}
                          onClick={() => { setCases(prev => prev.map(c => c.id === base.id ? { ...c, tags: (c.tags || []).filter(t => t !== name) } : c)); setCardNotifications(prev => new Set(prev).add(base.id)); }}
                        >×</button>
                      </span>
                    ))}
                  </div>
                )}
              </DrawerSection>

              <DrawerSection>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontWeight:800, color:'#333' }}>Comments</div>
                  <button style={{ border:'none', background:'transparent', color:'#1A4B8F', cursor:'pointer' }} onClick={() => setShowCommentsPanel(true)}>⤢</button>
                </div>
                <div style={{ color:'#666', marginTop:6 }}>
                  {(base.comments && base.comments.length) ? base.comments[base.comments.length - 1].text : 'No comments yet.'}
                </div>
              </DrawerSection>

              <DrawerSection>
                <div style={{ color:'#333', fontSize:12 }}>Created by {base.createdBy || 'APOC'} • {base.createdAt ? new Date(base.createdAt).toLocaleString() : new Date().toLocaleString()}</div>
                {base.deadline && (
                  <div style={{ color:'#666', fontSize:12, marginTop:4 }}>Deadline: {new Date(base.deadline).toLocaleString()}</div>
                )}
              </DrawerSection>

              <div style={{ display:'flex', gap:8 }}>
                <Button onClick={() => setDrawerCase(null)}>Close</Button>
              </div>
            </DrawerBody>
          );
        })()}

        {drawerCase && drawerMode === 'create' && (
            <DrawerBody>
            <DrawerSection>
              <div style={{ fontWeight:800, color:'#333', marginBottom:8 }}>Create Case</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <input
                  style={{ padding:'10px 12px', border:'1px solid #e1e5e9', borderRadius:8 }}
                  placeholder="Search flight number..."
                  value={flightQuery}
                  onChange={(e) => setFlightQuery(e.target.value)}
                />
                {flightQuery && (
                  <div style={{ border:'1px solid #eef1f4', borderRadius:8, maxHeight:160, overflow:'auto', background:'#fff' }}>
                    {flightsCatalog.filter(f => f.flightNo.toLowerCase().includes(flightQuery.toLowerCase())).map(f => (
                      <div key={f.flightNo} style={{ padding:10, cursor:'pointer' }} onClick={() => { setSelectedFlight(f); setFlightQuery(f.flightNo); }}>
                        {f.flightNo} • {f.airline} • {f.route}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DrawerSection>

            {selectedFlight && (
              <>
                <DrawerSection>
                  <div style={{ fontWeight:800, color:'#333' }}>{selectedFlight.flightNo}</div>
                  <div style={{ color:'#666', marginTop:4 }}>{selectedFlight.airline} • {selectedFlight.route}</div>
                  <div style={{ color:'#666', marginTop:6 }}>Scheduled: {selectedFlight.scheduledTime}</div>
                  <div style={{ marginTop:6, display:'flex', gap:8, alignItems:'center' }}>
                    <Badge severity={severityFromDelay(selectedFlight.predictedDelay)}>{severityFromDelay(selectedFlight.predictedDelay)}</Badge>
                    <span style={{ color:'#333' }}>Predicted Delay: {selectedFlight.predictedDelay === 0 ? 'On Time' : `${selectedFlight.predictedDelay} min`}</span>
                  </div>
                </DrawerSection>

                <DrawerSection>
                  <div style={{ fontWeight:800, color:'#333', marginBottom:6 }}>Propagation Impact</div>
                  {selectedFlight.flightNo === 'BA952' ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      <div style={{ padding:12, background:'#f8f9fa', borderRadius:8, borderLeft:'3px solid #1A4B8F' }}>
                        <div style={{ fontWeight:600, color:'#1A4B8F' }}>Impacts Flight LH305</div>
                        <div style={{ color:'#666' }}>+22 min delay</div>
                      </div>
                      <div style={{ padding:12, background:'#f8f9fa', borderRadius:8, borderLeft:'3px solid #1A4B8F' }}>
                        <div style={{ fontWeight:600, color:'#1A4B8F' }}>Impacts Flight AF1825</div>
                        <div style={{ color:'#666' }}>+15 min delay</div>
                      </div>
                    </div>
                  ) : selectedFlight.flightNo === 'SN789' ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      <div style={{ padding:12, background:'#f8f9fa', borderRadius:8, borderLeft:'3px solid #1A4B8F' }}>
                        <div style={{ fontWeight:600, color:'#1A4B8F' }}>Impacts Flight EW7823</div>
                        <div style={{ color:'#666' }}>+8 min delay</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ color:'#666' }}>No propagation detected</div>
                  )}
                </DrawerSection>

                <DrawerSection>
                  <div style={{ fontWeight:800, color:'#333', marginBottom:6 }}>Cause Breakdown</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {getCauseBreakdown(selectedFlight).map(item => (
                      <div key={item.label} style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ minWidth:110, color:'#333' }}>{item.label}</div>
                        <div style={{ flex:1, height:8, background:'#f1f3f4', borderRadius:4 }}>
                          <div style={{ width:`${item.pct}%`, height:8, background: causeColor(item.label), borderRadius:4 }} />
                        </div>
                        <div style={{ minWidth:40, color:'#333', textAlign:'right' }}>{item.pct}%</div>
                      </div>
                    ))}
                  </div>
                </DrawerSection>

                <DrawerSection>
                  <div style={{ fontWeight:800, color:'#333', marginBottom:8 }}>Tag Cause</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {['Weather','Traffic','Reactionary','Technical'].map(name => (
                      <CauseButton key={name} active={createTags.has(name)} onClick={() => toggleCreateTag(name)}>{name} {createTags.has(name) ? '✓' : ''}</CauseButton>
                    ))}
                  </div>
                  <div style={{ marginTop:8 }}>
                    <input
                      style={{ padding:'8px 10px', border:'1px solid #e1e5e9', borderRadius:8, width:'100%' }}
                      placeholder="Type a cause and press Enter to tag"
                      onKeyDown={handleCreateTagEnter}
                    />
                  </div>
                  {createTags.size > 0 && (
                    <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
                      {Array.from(createTags).map(name => (
                        <span key={name} style={{ position:'relative' }}>
                          <Pill>{name}</Pill>
                          <button
                            title="Remove"
                            style={{ position:'absolute', top:-6, right:-6, border:'none', background:'#e2e8f0', borderRadius:'50%', width:16, height:16, cursor:'pointer', fontSize:10 }}
                            onClick={() => setCreateTags(prev => { const n = new Set(prev); n.delete(name); return n; })}
                          >×</button>
                        </span>
                      ))}
                    </div>
                  )}
                  
                </DrawerSection>

                <DrawerSection>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontWeight:800, color:'#333' }}>Comments</div>
                  <button style={{ border:'none', background:'transparent', color:'#1A4B8F', cursor:'pointer' }} onClick={() => setShowCommentsPanel(true)}>⤢</button>
                </div>
                <div style={{ color:'#666', marginTop:6 }}>
                  {comments.length ? comments[comments.length - 1].text : 'No comments yet.'}
                </div>
              </DrawerSection>

              <DrawerSection>
                  <div style={{ color:'#333', fontSize:12 }}>Created by APOC • {new Date().toLocaleString()}</div>
                  <div style={{ marginTop:8 }}>
                    <div style={{ fontWeight:800, color:'#333', marginBottom:6 }}>Deadline (optional)</div>
                    <input type="datetime-local" style={{ padding:'8px 10px', border:'1px solid #e1e5e9', borderRadius:8, width:'100%' }} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                  </div>
                </DrawerSection>

                <div style={{ display:'flex', gap:8 }}>
                  <Button onClick={() => { setDrawerCase(null); setDrawerMode('view'); }}>Cancel</Button>
                  <Button primary onClick={saveNewCase} disabled={!selectedFlight}>Save Case</Button>
                </div>
              </>
            )}
          </DrawerBody>
        )}
      </Drawer>

      {showClosed && (
        <ModalBackdrop onClick={() => setShowClosed(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight:800, color:'#333', marginBottom:8 }}>Closed Cases</div>
            {closedCases.length === 0 ? (
              <div style={{ color:'#666' }}>No closed cases yet.</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight: '60vh', overflow:'auto' }}>
                {closedCases.map(cc => (
                  <div key={cc.id} style={{ padding:12, border:'1px solid #eef1f4', borderRadius:8 }}>
                    <div style={{ fontWeight:800, color:'#333' }}>{cc.flightNo}</div>
                    <div style={{ color:'#666', fontSize:12 }}>{cc.airline} • {cc.route}</div>
                    <div style={{ color:'#666', fontSize:12 }}>Closed: {new Date(cc.closedAt).toLocaleString()}</div>
                    <div style={{ marginTop:6 }}><Badge severity={cc.severity}>{cc.severity}</Badge> <Tag>{cc.cause}</Tag> <Pill>{cc.assignee}</Pill></div>
                  </div>
                ))}
              </div>
            )}
            <ModalActions>
              <Button onClick={() => setShowClosed(false)}>Close</Button>
            </ModalActions>
          </ModalCard>
        </ModalBackdrop>
      )}
    </PageContainer>
    </PageLayout>
  );
};

export default MitigationBoard;
import React, { useMemo, useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import {
  GlobalFonts,
  DetailDrawer, DrawerHeader, DrawerTitle, DrawerSubtitle,
  DrawerContent, DrawerSection, DrawerSectionTitle,
  DrawerFooter, DrawerButton as StyledDrawerButton,
  PredictionBlock, PredictionRow, PredictionLabel, PredictionValue,
} from '../styles/components.styles';
import NavigationBar from './NavigationBar';
import { PageLayout } from './PageLayout';
import { getCases, getClosedCases, createCase, updateCaseStatus, updateCase, closeCase, permanentDeleteCase, getComments, addComment } from '../services/mitigationService';
import { fetchFlights } from '../services/predictionService';
import API_BASE_URL from '../config/api';

const WS_URL = API_BASE_URL.replace(/^http/, 'ws').replace(/\/api$/, '');

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

const DrawerOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 998;
  background: transparent;
  cursor: default;
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
  const [pendingClose, setPendingClose] = useState(null);   // case object awaiting close confirm
  const [duplicateWarning, setDuplicateWarning] = useState(null); // { flightNo, colName }
  const [liveFlights, setLiveFlights] = useState([]);
  const wsRef = useRef(null);

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

  // Load cases and live flights on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadBoard();
    fetchFlights().then(flights => { if (flights) setLiveFlights(flights); }).catch(() => {});
  }, []);

  const handleCreateTagEnter = (e) => {
    if (e.key === 'Enter') {
      const val = (e.target.value || '').trim();
      if (!val) return;
      setCreateTags(prev => new Set([...Array.from(prev), val]));
      e.target.value = '';
    }
  };

  const handleViewTagEnter = async (e) => {
    if (e.key === 'Enter') {
      const val = (e.target.value || '').trim();
      if (!val) return;
      await toggleViewTag(val);
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

  const severityFromDelay = (min) => {
    if (min >= 30) return 'major';
    if (min >= 12) return 'moderate';
    return 'minor';
  };

  const escalatedSeverity = (base, tagCount) => {
    const levels = ['minor', 'moderate', 'major'];
    const idx = levels.indexOf(base);
    const bump = tagCount >= 3 ? 2 : tagCount >= 2 ? 1 : 0;
    return levels[Math.min((idx < 0 ? 0 : idx) + bump, 2)];
  };

  // Normalize cases from API to UI format
  const normalizedCases = cases.map(c => {
    const taggedArr = Array.isArray(c.tagged_causes) ? c.tagged_causes : [];
    const baseSev = severityFromDelay(c.predicted_delay_min || 0);
    const displaySeverity = escalatedSeverity(baseSev, taggedArr.length);
    const cardCauses = [];
    if (c.likely_cause) cardCauses.push(c.likely_cause);
    for (const t of taggedArr) {
      if (!cardCauses.includes(t)) cardCauses.push(t);
    }
    return {
      ...c,
      column: statusToColumn[c.status] || 'identified',
      severity: displaySeverity,
      cause: c.likely_cause || 'Unknown',
      route: c.route || '—',
      delayMin: c.predicted_delay_min || 0,
      flightNo: c.flight_number,
      airline: c.airline_code || '—',
      cardCauses,
      unseen: false
    };
  });

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
  const columnOrder = ['identified', 'inprogress', 'verified', 'resolved'];

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
    const card = normalizedCases.find(c => c.id === dragging);
    if (!card || card.column === colKey) { setDragging(null); return; }
    setPendingMove({ id: dragging, from: card.column, to: colKey });
    setDragging(null);
  };

  const confirmMove = async () => {
    if (!pendingMove) return;
    const statusMap = {
      'identified': 'delayNoted',
      'inprogress': 'inProgress',
      'verified': 'verified',
      'resolved': 'resolved'
    };
    try {
      const newDbStatus = statusMap[pendingMove.to] || pendingMove.to;
      const currentCase = cases.find(c => c.id === pendingMove.id);
      const updatedCase = await updateCaseStatus(pendingMove.id, newDbStatus, currentCase?.version);
      setCases(prev => prev.map(c => c.id === pendingMove.id
        ? { ...c, status: newDbStatus, version: updatedCase?.version ?? c.version }
        : c));
      setCardNotifications(prev => new Set(prev).add(pendingMove.id));
    } catch (error) {
      if (error.response?.status === 409) {
        alert('This case was updated by another user. The board will refresh with the latest data.');
        await loadBoard();
      } else {
        console.error('Error updating case status:', error);
        alert('Failed to move case. Please try again.');
      }
    }
    setPendingMove(null);
  };
  const cancelMove = () => setPendingMove(null);

  const handleCloseCase = (c) => {
    if (!canEdit) return;
    setPendingClose(c);
  };

  const confirmClose = async () => {
    if (!pendingClose) return;
    try {
      const currentCase = cases.find(c => c.id === pendingClose.id);
      const closedCase = await closeCase(pendingClose.id, currentCase?.version);
      setClosedCases(prev => [{ ...pendingClose, closed_at: new Date().toISOString() }, ...prev]);
      setCases(prev => prev.filter(x => x.id !== pendingClose.id));
    } catch (error) {
      if (error.response?.status === 409) {
        alert('This case was modified by another user. The board will refresh with the latest data.');
        await loadBoard();
      } else {
        console.error('Error closing case:', error);
        alert('Failed to close case. Please try again.');
      }
    }
    setPendingClose(null);
  };

  const permanentDeleteHandler = async (cc) => {
    try {
      await permanentDeleteCase(cc.id);
      setClosedCases(prev => prev.filter(x => x.id !== cc.id));
    } catch (error) {
      console.error('Error permanently deleting case:', error);
      alert('Failed to delete case. Please try again.');
    }
  };

  const openCase = async (c) => {
    setDrawerMode('view');
    const rawCauses = c.tagged_causes;
    const causesArray = Array.isArray(rawCauses)
      ? rawCauses
      : typeof rawCauses === 'string' && rawCauses.startsWith('{')
        ? rawCauses.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean)
        : (rawCauses ? [rawCauses] : []);
    setDrawerCase({ ...c, tags: new Set(causesArray), tagged_causes: causesArray });
    setCases(prev => prev.map(x => x.id === c.id ? { ...x, unseen: false } : x));
    setCardNotifications(prev => {
      const next = new Set(prev);
      next.delete(c.id);
      return next;
    });
    setComments([]);
    try {
      const caseComments = await getComments(c.id);
      setComments(caseComments || []);
    } catch (error) {
      console.warn('Error loading comments:', error);
      setComments([]);
    }

    // Open WebSocket for real-time comments
    if (wsRef.current) wsRef.current.close();
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onopen = () => {
      const token = localStorage.getItem('token');
      ws.send(JSON.stringify({ type: 'auth', token }));
      ws.send(JSON.stringify({ type: 'join', caseId: c.id }));
    };
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'comment') {
          setComments(prev =>
            prev.some(x => x.id === msg.comment.id) ? prev : [...prev, msg.comment]
          );
        }
      } catch {}
    };
    ws.onerror = (err) => console.warn('WebSocket error:', err);
  };

  const toggleViewTag = async (name) => {
    if (!drawerCase || (!canEdit && !canReassign)) return;
    const currentTags = drawerCase.tags instanceof Set ? drawerCase.tags : new Set();
    const nextTags = new Set(currentTags);
    if (nextTags.has(name)) nextTags.delete(name); else nextTags.add(name);
    const tagsArray = Array.from(nextTags);
    // Optimistic update
    setDrawerCase(prev => ({ ...prev, tags: nextTags, tagged_causes: tagsArray }));
    setCases(prev => prev.map(c => c.id === drawerCase.id ? { ...c, tagged_causes: tagsArray } : c));
    setCardNotifications(prev => new Set(prev).add(drawerCase.id));
    try {
      const updatedCase = await updateCase(drawerCase.id, { tagged_causes: tagsArray, version: drawerCase.version });
      if (updatedCase?.version) {
        setDrawerCase(prev => prev ? { ...prev, version: updatedCase.version } : prev);
        setCases(prev => prev.map(c => c.id === drawerCase.id ? { ...c, version: updatedCase.version } : c));
      }
    } catch (error) {
      if (error.response?.status === 409) {
        alert('This case was modified by another user. The board will refresh with the latest data.');
        setDrawerCase(prev => prev ? { ...prev, tags: currentTags, tagged_causes: Array.from(currentTags) } : prev);
        setCases(prev => prev.map(c => c.id === drawerCase.id ? { ...c, tagged_causes: Array.from(currentTags) } : c));
        await loadBoard();
      } else {
        console.error('Error saving tag:', error);
      }
    }
  };

  const removeViewTag = async (name) => {
    if (!drawerCase) return;
    const currentTags = drawerCase.tags instanceof Set ? drawerCase.tags : new Set();
    const nextTags = new Set([...currentTags].filter(t => t !== name));
    const tagsArray = Array.from(nextTags);
    // Optimistic update
    setDrawerCase(prev => ({ ...prev, tags: nextTags, tagged_causes: tagsArray }));
    setCases(prev => prev.map(c => c.id === drawerCase.id ? { ...c, tagged_causes: tagsArray } : c));
    setCardNotifications(prev => new Set(prev).add(drawerCase.id));
    try {
      const updatedCase = await updateCase(drawerCase.id, { tagged_causes: tagsArray, version: drawerCase.version });
      if (updatedCase?.version) {
        setDrawerCase(prev => prev ? { ...prev, version: updatedCase.version } : prev);
        setCases(prev => prev.map(c => c.id === drawerCase.id ? { ...c, version: updatedCase.version } : c));
      }
    } catch (error) {
      if (error.response?.status === 409) {
        alert('This case was modified by another user. The board will refresh with the latest data.');
        setDrawerCase(prev => prev ? { ...prev, tags: currentTags, tagged_causes: Array.from(currentTags) } : prev);
        setCases(prev => prev.map(c => c.id === drawerCase.id ? { ...c, tagged_causes: Array.from(currentTags) } : c));
        await loadBoard();
      } else {
        console.error('Error removing tag:', error);
      }
    }
  };

  const openCreateDrawer = () => {
    if (!canEdit) return;
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
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
      setComments(prev =>
        prev.some(x => x.id === newComment.id) ? prev : [...prev, newComment]
      );
      if (drawerCase && drawerMode === 'view') {
        setCardNotifications(prev => new Set(prev).add(drawerCase.id));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    }
  };


  const saveNewCase = async () => {
    if (!selectedFlight) return;
    // Prevent duplicate: check if a case for this flight already exists in any active column
    const duplicate = cases.find(c => c.flight_number === selectedFlight.flightNo);
    if (duplicate) {
      const colName = columns.find(col => col.key === (statusToColumn[duplicate.status] || 'identified'))?.title || duplicate.status;
      setDuplicateWarning({ flightNo: selectedFlight.flightNo, colName });
      return;
    }
    try {
      const rawTags = Array.from(createTags);
      const primaryCause = rawTags[0] || (selectedFlight.likelyCause || 'Other');
      
      const newCaseData = {
        flight_number: selectedFlight.flightNo,
        sched_utc: selectedFlight.sched_utc || new Date().toISOString(),
        airline_code: selectedFlight.airlineCode || selectedFlight.airline?.substring(0, 2) || null,
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

  const airlines = ['All', ...Array.from(new Set(normalizedCases.map(c => c.airline)))];
  const severities = ['All', 'minor', 'moderate', 'major'];

  return (
    <PageLayout>
    <PageContainer>
      <GlobalFonts />
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
          <div style={{ textAlign:'center', padding:'18px 0 10px' }}>
            <Title style={{ display:'inline-block', margin:0 }}>Mitigation Tracker Board</Title>
          </div>
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
                  {filtered.filter(c => c.column === col.key).map(c => {
                    const colIdx = columnOrder.indexOf(c.column);
                    const prevCol = colIdx > 0 ? columnOrder[colIdx - 1] : null;
                    const nextCol = colIdx < columnOrder.length - 1 ? columnOrder[colIdx + 1] : null;
                    const prevTitle = prevCol ? columns.find(x => x.key === prevCol)?.title : null;
                    const nextTitle = nextCol ? columns.find(x => x.key === nextCol)?.title : null;
                    return (
                      <Card key={c.id} draggable={canEdit} onDragStart={(e) => onDragStart(e, c.id)} onClick={() => openCase(c)}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                            {cardNotifications.has(c.id) && (
                              <span style={{ width:8, height:8, borderRadius:'50%', background:'#e74c3c', display:'inline-block', flexShrink:0 }} />
                            )}
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                            {canEdit && prevCol && (
                              <button
                                title={`← Move to ${prevTitle}`}
                                style={{ border:'1px solid #d1d5db', background:'#f9fafb', borderRadius:5, width:22, height:22, cursor:'pointer', fontSize:13, padding:0, lineHeight:1, color:'#555' }}
                                onClick={(e) => { e.stopPropagation(); setPendingMove({ id: c.id, from: c.column, to: prevCol }); }}
                              >←</button>
                            )}
                            {canEdit && nextCol && (
                              <button
                                title={`Move to ${nextTitle} →`}
                                style={{ border:'1px solid #d1d5db', background:'#f9fafb', borderRadius:5, width:22, height:22, cursor:'pointer', fontSize:13, padding:0, lineHeight:1, color:'#555' }}
                                onClick={(e) => { e.stopPropagation(); setPendingMove({ id: c.id, from: c.column, to: nextCol }); }}
                              >→</button>
                            )}
                            <button
                              title="Close case"
                              style={{ border:'none', background:'transparent', color:'#bbb', cursor:'pointer', padding:'0 3px', fontSize:14, lineHeight:1 }}
                              onClick={(e) => { e.stopPropagation(); handleCloseCase(c); }}
                            >✕</button>
                          </div>
                        </div>
                        <CardTitle>{c.flightNo}</CardTitle>
                        <CardSub>{c.airline} • {c.route}</CardSub>
                        <div style={{ display:'flex', gap:4, marginTop:8, alignItems:'center', flexWrap:'wrap' }}>
                          <Badge severity={c.severity}>{c.severity}</Badge>
                          {(c.cardCauses || []).slice(0, 2).map(cause => (
                            <Tag key={cause} style={{ fontSize:11, padding:'2px 6px' }}>{cause}</Tag>
                          ))}
                          {(c.cardCauses || []).length > 2 && (
                            <Tag style={{ fontSize:11, padding:'2px 6px' }}>+{c.cardCauses.length - 2}</Tag>
                          )}
                        </div>
                      </Card>
                    );
                  })}
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
                  const author = c.author_username || c.by || '';
                  const isSelf = author.toLowerCase() === (userName || 'apoc').toLowerCase();
                  const ts = c.created_at || c.at;
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
                      <div style={{ color:'#333' }}>{c.comment_text || c.text}</div>
                      <div style={{ color:'#666', fontSize:12, marginTop:4 }}>{ts ? new Date(ts).toLocaleString() : 'just now'} • {author}</div>
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
            <div style={{ fontWeight:800, color:'#333', marginBottom:8 }}>Confirm Move</div>
            <div style={{ color:'#333' }}>Move <strong>{normalizedCases.find(c => c.id === pendingMove.id)?.flightNo}</strong> from <em>{columns.find(c => c.key === pendingMove.from)?.title}</em> → <em>{columns.find(c => c.key === pendingMove.to)?.title}</em>?</div>
            <ModalActions>
              <Button onClick={cancelMove}>Cancel</Button>
              <Button primary onClick={confirmMove}>Confirm</Button>
            </ModalActions>
          </ModalCard>
        </ModalBackdrop>
      )}

      {pendingClose && (
        <ModalBackdrop>
          <ModalCard>
            <div style={{ fontWeight:800, color:'#333', marginBottom:8 }}>Close Case</div>
            <div style={{ color:'#333' }}>Close case for flight <strong>{pendingClose.flightNo || pendingClose.flight_number}</strong>? It will be moved to the Closed Cases archive.</div>
            <ModalActions>
              <Button onClick={() => setPendingClose(null)}>Cancel</Button>
              <Button primary onClick={confirmClose}>Close Case</Button>
            </ModalActions>
          </ModalCard>
        </ModalBackdrop>
      )}

      {duplicateWarning && (
        <ModalBackdrop>
          <ModalCard>
            <div style={{ fontWeight:800, color:'#333', marginBottom:8 }}>Case Already Exists</div>
            <div style={{ color:'#555' }}>
              A case for flight <strong>{duplicateWarning.flightNo}</strong> already exists in the{' '}
              <strong>{duplicateWarning.colName}</strong> column.
            </div>
            <ModalActions>
              <Button primary onClick={() => setDuplicateWarning(null)}>OK</Button>
            </ModalActions>
          </ModalCard>
        </ModalBackdrop>
      )}

      {drawerCase && (
        <DrawerOverlay onClick={() => {
          if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
          setDrawerCase(null);
          setDrawerMode('view');
        }} />
      )}
      <DetailDrawer isOpen={!!drawerCase}>
        {drawerCase && drawerMode === 'view' && (() => {
          const base = normalizedCases.find(c => c.id === drawerCase.id) || drawerCase || {};
          const viewTags = drawerCase.tags || new Set();
          const schedDate = base.sched_utc ? new Date(base.sched_utc) : null;
          const estimatedDate = schedDate && base.delayMin
            ? new Date(schedDate.getTime() + base.delayMin * 60000)
            : schedDate;
          return (
            <>
              <DrawerHeader>
                <DrawerTitle>{base.flightNo || '—'}</DrawerTitle>
                <DrawerSubtitle>
                  {[base.airline, base.route].filter(Boolean).join(' · ')}
                </DrawerSubtitle>
              </DrawerHeader>

              <DrawerContent>
                <DrawerSection>
                  <DrawerSectionTitle>Flight Details</DrawerSectionTitle>
                  <PredictionBlock>
                    <PredictionRow>
                      <PredictionLabel>Scheduled</PredictionLabel>
                      <PredictionValue>
                        {schedDate ? schedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </PredictionValue>
                    </PredictionRow>
                    <PredictionRow>
                      <PredictionLabel>Estimated</PredictionLabel>
                      <PredictionValue style={{ color: base.delayMin > 0 ? '#dc2626' : '#16a34a' }}>
                        {estimatedDate ? estimatedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </PredictionValue>
                    </PredictionRow>
                    <PredictionRow>
                      <PredictionLabel>Delay Category</PredictionLabel>
                      <PredictionValue>
                        <Badge severity={base.severity || 'minor'}>{base.severity || 'minor'}</Badge>
                      </PredictionValue>
                    </PredictionRow>
                    <PredictionRow>
                      <PredictionLabel>Predicted Delay</PredictionLabel>
                      <PredictionValue style={{ color: base.delayMin > 0 ? '#dc2626' : '#16a34a' }}>
                        {base.delayMin > 0 ? `+${base.delayMin} min` : 'On Time'}
                      </PredictionValue>
                    </PredictionRow>
                  </PredictionBlock>
                </DrawerSection>

                <DrawerSection>
                  <DrawerSectionTitle>Propagation Impact</DrawerSectionTitle>
                  <div style={{ color:'#666', fontSize:13, lineHeight:1.6 }}>Propagation analysis not available — check Flights table for connected flights.</div>
                </DrawerSection>

                <DrawerSection>
                  <DrawerSectionTitle>Likely Cause Identified</DrawerSectionTitle>
                  {(() => {
                    const causes = Array.isArray(base.tagged_causes) && base.tagged_causes.length > 0
                      ? base.tagged_causes
                      : (base.cause && base.cause !== 'Unknown' ? [base.cause] : []);
                    if (causes.length === 0) return <div style={{ color:'#999', fontSize:13 }}>No cause identified yet.</div>;
                    return (
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                        {causes.map(c => (
                          <span key={c} style={{ padding:'4px 12px', borderRadius:999, background:'#eef2ff', color:'#1A4B8F', fontSize:13, fontWeight:600 }}>{c}</span>
                        ))}
                      </div>
                    );
                  })()}
                </DrawerSection>

                <DrawerSection>
                  <DrawerSectionTitle>Tag Cause</DrawerSectionTitle>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {['Weather','Traffic','Reactionary','Technical'].map(name => (
                      <CauseButton key={name} active={viewTags.has(name)} onClick={() => toggleViewTag(name)}>{name} {viewTags.has(name) ? '✓' : ''}</CauseButton>
                    ))}
                  </div>
                  <div style={{ marginTop:8 }}>
                    <input
                      style={{ padding:'8px 10px', border:'1px solid #e1e5e9', borderRadius:8, width:'100%', fontFamily:'inherit' }}
                      placeholder="Type a cause and press Enter to tag"
                      onKeyDown={handleViewTagEnter}
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
                            onClick={() => removeViewTag(name)}
                          >×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </DrawerSection>

                <DrawerSection>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                    <DrawerSectionTitle style={{ marginBottom:0 }}>Comments</DrawerSectionTitle>
                    <button style={{ border:'none', background:'transparent', color:'#1A4B8F', cursor:'pointer', fontSize:16 }} onClick={() => setShowCommentsPanel(true)}>⤢</button>
                  </div>
                  <div style={{ color:'#666', fontSize:13 }}>
                    {comments.length ? (comments[comments.length - 1].comment_text || comments[comments.length - 1].text) : 'No comments yet.'}
                  </div>
                </DrawerSection>

                <DrawerSection>
                  <div style={{ color:'#94a3b8', fontSize:12 }}>
                    Created by {base.createdBy || 'APOC'} · {base.createdAt ? new Date(base.createdAt).toLocaleString() : new Date().toLocaleString()}
                  </div>
                  {base.deadline && (
                    <div style={{ color:'#666', fontSize:12, marginTop:4 }}>Deadline: {new Date(base.deadline).toLocaleString()}</div>
                  )}
                </DrawerSection>
              </DrawerContent>

              <DrawerFooter>
                <StyledDrawerButton onClick={() => {
                  if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
                  setDrawerCase(null);
                }}>Close</StyledDrawerButton>
              </DrawerFooter>
            </>
          );
        })()}

        {drawerCase && drawerMode === 'create' && (
          <>
            <DrawerHeader>
              <DrawerTitle>Create Case</DrawerTitle>
              <DrawerSubtitle>Search for a flight to open a mitigation case</DrawerSubtitle>
            </DrawerHeader>

            <DrawerContent>
              <DrawerSection>
                <DrawerSectionTitle>Select Flight</DrawerSectionTitle>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <input
                    style={{ padding:'10px 12px', border:'1px solid #e1e5e9', borderRadius:8, fontFamily:'inherit' }}
                    placeholder="Search flight number..."
                    value={flightQuery}
                    onChange={(e) => setFlightQuery(e.target.value)}
                  />
                  {flightQuery && (
                    <div style={{ border:'1px solid #eef1f4', borderRadius:8, maxHeight:160, overflow:'auto', background:'#fff' }}>
                      {liveFlights
                        .filter(f => (f.flightNo || '').toLowerCase().includes(flightQuery.toLowerCase()))
                        .slice(0, 20)
                        .map(f => (
                          <div key={f.flightNo + f.sched_utc} style={{ padding:10, cursor:'pointer', borderBottom:'1px solid #f5f5f5' }}
                            onClick={() => { setSelectedFlight(f); setFlightQuery(f.flightNo); }}>
                            <span style={{ fontWeight:600 }}>{f.flightNo}</span>
                            <span style={{ color:'#666', marginLeft:8 }}>{f.airline} · {f.route}</span>
                            {f.predictedDelay > 0 && <span style={{ color:'#dc2626', marginLeft:8, fontSize:12 }}>+{f.predictedDelay} min</span>}
                          </div>
                        ))
                      }
                      {liveFlights.filter(f => (f.flightNo || '').toLowerCase().includes(flightQuery.toLowerCase())).length === 0 && (
                        <div style={{ padding:10, color:'#999', fontSize:13 }}>No flights found</div>
                      )}
                    </div>
                  )}
                </div>
              </DrawerSection>

              {selectedFlight && (
                <>
                  <DrawerSection>
                    <DrawerSectionTitle>Flight Details</DrawerSectionTitle>
                    <PredictionBlock>
                      <PredictionRow>
                        <PredictionLabel>Flight</PredictionLabel>
                        <PredictionValue>{selectedFlight.flightNo}</PredictionValue>
                      </PredictionRow>
                      <PredictionRow>
                        <PredictionLabel>Airline · Route</PredictionLabel>
                        <PredictionValue style={{ fontSize:13 }}>{selectedFlight.airline} · {selectedFlight.route}</PredictionValue>
                      </PredictionRow>
                      <PredictionRow>
                        <PredictionLabel>Scheduled</PredictionLabel>
                        <PredictionValue>
                          {selectedFlight.scheduledTime || (selectedFlight.sched_utc ? new Date(selectedFlight.sched_utc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—')}
                        </PredictionValue>
                      </PredictionRow>
                      <PredictionRow>
                        <PredictionLabel>Delay Category</PredictionLabel>
                        <PredictionValue>
                          <Badge severity={severityFromDelay(selectedFlight.predictedDelay)}>{severityFromDelay(selectedFlight.predictedDelay)}</Badge>
                        </PredictionValue>
                      </PredictionRow>
                      <PredictionRow>
                        <PredictionLabel>Predicted Delay</PredictionLabel>
                        <PredictionValue style={{ color: selectedFlight.predictedDelay > 0 ? '#dc2626' : '#16a34a' }}>
                          {selectedFlight.predictedDelay > 0 ? `+${selectedFlight.predictedDelay} min` : 'On Time'}
                        </PredictionValue>
                      </PredictionRow>
                    </PredictionBlock>
                  </DrawerSection>

                  <DrawerSection>
                    <DrawerSectionTitle>Likely Cause Identified</DrawerSectionTitle>
                    {selectedFlight.likelyCause
                      ? <span style={{ padding:'4px 12px', borderRadius:999, background:'#eef2ff', color:'#1A4B8F', fontSize:13, fontWeight:600 }}>{selectedFlight.likelyCause}</span>
                      : <div style={{ color:'#999', fontSize:13 }}>No cause identified.</div>
                    }
                  </DrawerSection>

                  <DrawerSection>
                    <DrawerSectionTitle>Tag Cause</DrawerSectionTitle>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                      {['Weather','Traffic','Reactionary','Technical'].map(name => (
                        <CauseButton key={name} active={createTags.has(name)} onClick={() => toggleCreateTag(name)}>{name} {createTags.has(name) ? '✓' : ''}</CauseButton>
                      ))}
                    </div>
                    <div style={{ marginTop:8 }}>
                      <input
                        style={{ padding:'8px 10px', border:'1px solid #e1e5e9', borderRadius:8, width:'100%', fontFamily:'inherit' }}
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
                    <DrawerSectionTitle>Deadline (optional)</DrawerSectionTitle>
                    <input type="datetime-local" style={{ padding:'8px 10px', border:'1px solid #e1e5e9', borderRadius:8, width:'100%', fontFamily:'inherit' }} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                    <div style={{ color:'#94a3b8', fontSize:12, marginTop:8 }}>Created by {userName || 'APOC'} · {new Date().toLocaleString()}</div>
                  </DrawerSection>
                </>
              )}
            </DrawerContent>

            <DrawerFooter>
              <StyledDrawerButton onClick={() => { if (wsRef.current) { wsRef.current.close(); wsRef.current = null; } setDrawerCase(null); setDrawerMode('view'); }}>Cancel</StyledDrawerButton>
              <StyledDrawerButton primary onClick={saveNewCase} disabled={!selectedFlight}>Save Case</StyledDrawerButton>
            </DrawerFooter>
          </>
        )}
      </DetailDrawer>

      {showClosed && (
        <ModalBackdrop onClick={() => setShowClosed(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight:800, color:'#333', marginBottom:8 }}>Closed Cases</div>
            {closedCases.length === 0 ? (
              <div style={{ color:'#666' }}>No closed cases yet.</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight: '60vh', overflow:'auto' }}>
                {closedCases.map(cc => (
                  <div key={cc.id} style={{ padding:12, border:'1px solid #eef1f4', borderRadius:8, position:'relative' }}>
                    <button
                      title="Permanently delete"
                      style={{ position:'absolute', top:8, right:8, border:'none', background:'transparent', cursor:'pointer', color:'#bbb', fontSize:16, lineHeight:1, padding:2 }}
                      onClick={() => permanentDeleteHandler(cc)}
                    >🗑</button>
                    <div style={{ fontWeight:800, color:'#333', paddingRight:24 }}>{cc.flightNo || cc.flight_number}</div>
                    <div style={{ color:'#666', fontSize:12 }}>{cc.airline || cc.airline_code} • {cc.route}</div>
                    <div style={{ color:'#666', fontSize:12 }}>Closed: {cc.closed_at ? new Date(cc.closed_at).toLocaleString() : cc.closedAt ? new Date(cc.closedAt).toLocaleString() : '—'}</div>
                    <div style={{ marginTop:6, display:'flex', gap:6, flexWrap:'wrap' }}>
                      {cc.severity && <Badge severity={cc.severity}>{cc.severity}</Badge>}
                      {(cc.cause || cc.likely_cause) && <Tag>{cc.cause || cc.likely_cause}</Tag>}
                    </div>
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
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
import { getCases, getClosedCases, createCase, updateCaseStatus, updateCase, closeCase, permanentDeleteCase, getComments, addComment, deleteComment, toggleReaction } from '../services/mitigationService';
import { fetchFlights, fetchPropagation, filterFlightsForAoc, filterCasesForAoc } from '../services/predictionService';
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

const ChipGroup = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
`;

const FilterChip = styled.button`
  padding: 6px 12px;
  border-radius: 999px;
  border: none;
  background: ${p => p.active ? (p.severity === 'major' ? '#dc2626' : p.severity === 'moderate' ? '#f59e0b' : p.severity === 'minor' ? '#3b82f6' : '#1A4B8F') : '#f1f3f4'};
  color: ${p => p.active ? '#fff' : '#555'};
  font-weight: ${p => p.active ? 700 : 400};
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
  &:hover { opacity: 0.8; }
`;

const ClearLink = styled.button`
  background: none;
  border: none;
  color: #1A4B8F;
  font-size: 11px;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  margin-left: auto;
  &:hover { opacity: 0.7; }
`;


const MitigationBoard = ({ userRole = 'APOC', userName, onLogout, activeTab, onTabChange,
  notifCount = 0, hasNewNotif = false, notifOpen = false, liveAlerts = [], onNotifClick, onNotifClose,
  onAlertDismiss, onAlertAddToBoard, refreshTrigger = 0, ...navExtras
}) => {
  const [query, setQuery] = useState('');
  const [activeAirlines, setActiveAirlines] = useState(new Set());
  const [activeSeverities, setActiveSeverities] = useState(new Set());
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
  const [propagationData, setPropagationData] = useState(null);
  const [propagationLoading, setPropagationLoading] = useState(false);
  const [rolePerms, setRolePerms] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [hoveredCommentId, setHoveredCommentId] = useState(null);
  const [openMenuCommentId, setOpenMenuCommentId] = useState(null);
  const [emojiPickerCommentId, setEmojiPickerCommentId] = useState(null);
  const chatDialogRef = useRef(null);
  const wsRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const activeCaseIdRef = useRef(null);

  const currentUser = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
  const currentUserId = currentUser.id;
  const boardFlights = useMemo(
    () => filterFlightsForAoc(liveFlights || [], userRole),
    [liveFlights, userRole]
  );

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

  useEffect(() => {
    if (refreshTrigger > 0) {
      loadBoard();
    }
  }, [refreshTrigger]);

  useEffect(() => {
    if (!showCommentsPanel) return undefined;

    const handleClickOutside = (e) => {
      if (openMenuCommentId === null) return;

      const clickedInsideDialog = chatDialogRef.current?.contains(e.target);
      const clickedMenu = e.target.closest('[data-comment-menu]');
      if (!clickedInsideDialog || !clickedMenu) {
        setOpenMenuCommentId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuCommentId, showCommentsPanel]);

  // Fetch role permissions on mount and keep them fresh while the user is logged in.
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/auth/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.settings) {
            const rolePerms = data.settings.find(s => s.key === 'role_permissions');
            if (rolePerms) {
              setRolePerms(JSON.parse(rolePerms.value));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
      }
    };
    fetchPermissions();
    const permissionsInterval = setInterval(fetchPermissions, 5 * 60 * 1000);
    return () => clearInterval(permissionsInterval);
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

  const canEdit = rolePerms
    ? (rolePerms[userRole]?.trackerEdit ?? (userRole === 'APOC' || userRole === 'AOC'))
    : (userRole === 'APOC' || userRole === 'AOC');
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

  const displayCases = useMemo(
    () => filterCasesForAoc(normalizedCases, userRole),
    [normalizedCases, userRole]
  );

  const displayClosedCases = useMemo(
    () => filterCasesForAoc(closedCases, userRole),
    [closedCases, userRole]
  );

  const filtered = useMemo(() => {
    return displayCases.filter(c =>
      (query === '' || c.flightNo.toLowerCase().includes(query.toLowerCase()) || c.airline.toLowerCase().includes(query.toLowerCase())) &&
      (activeAirlines.size === 0 || activeAirlines.has(c.airline)) &&
      (activeSeverities.size === 0 || activeSeverities.has(c.severity))
    );
  }, [displayCases, query, activeAirlines, activeSeverities]);

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
    const card = displayCases.find(c => c.id === dragging);
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
    setPropagationData(null);
    setPropagationLoading(false);
    try {
      const caseComments = await getComments(c.id);
      setComments(caseComments || []);
    } catch (error) {
      console.warn('Error loading comments:', error);
      setComments([]);
    }

    // Fetch propagation data
    setPropagationLoading(true);
    setPropagationData(null);
    try {
      const propagation = await fetchPropagation(c.flight_number, c.sched_utc);
      setPropagationData(Array.isArray(propagation) ? propagation : []);
    } catch (error) {
      console.warn('Error loading propagation:', error);
      setPropagationData([]);
    } finally {
      setPropagationLoading(false);
    }

    // Open WebSocket for real-time comments with auto-reconnect
    activeCaseIdRef.current = c.id;
    clearInterval(pollIntervalRef.current);

    const connectCaseWS = (caseId) => {
      if (wsRef.current) wsRef.current.close();
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onopen = () => {
        const token = localStorage.getItem('token');
        ws.send(JSON.stringify({ type: 'auth', token }));
        ws.send(JSON.stringify({ type: 'join', caseId }));
      };
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'comment') {
            setComments(prev =>
              prev.some(x => x.id === msg.comment.id) ? prev : [...prev, msg.comment]
            );
          } else if (msg.type === 'comment_deleted') {
            setComments(prev => prev.filter(c => c.id !== msg.commentId));
          } else if (msg.type === 'reaction_update') {
            setComments(prev => prev.map(c =>
              c.id === msg.commentId ? { ...c, reactions: msg.reactions } : c
            ));
          }
        } catch {}
      };
      ws.onerror = (err) => console.warn('WebSocket error:', err);
      ws.onclose = () => {
        if (activeCaseIdRef.current === caseId) {
          setTimeout(() => connectCaseWS(caseId), 2000);
        }
      };
    };

    connectCaseWS(c.id);

    // Polling fallback: fetch comments when WebSocket is not connected
    pollIntervalRef.current = setInterval(async () => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        try {
          const fresh = await getComments(c.id);
          setComments(fresh || []);
        } catch {}
      }
    }, 5000);
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
    activeCaseIdRef.current = null;
    clearInterval(pollIntervalRef.current);
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
      const newComment = await addComment(drawerCase.id, text, userName, replyingTo?.id || null);
      setComments(prev =>
        prev.some(x => x.id === newComment.id) ? prev : [...prev, newComment]
      );
      setReplyingTo(null);
      if (drawerCase && drawerMode === 'view') {
        setCardNotifications(prev => new Set(prev).add(drawerCase.id));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!drawerCase) return;
    try {
      await deleteComment(drawerCase.id, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };

  const handleReaction = async (commentId, emoji) => {
    if (!drawerCase) return;
    try {
      const data = await toggleReaction(drawerCase.id, commentId, emoji);
      if (data.success) {
        setComments(prev => prev.map(c =>
          c.id === commentId ? { ...c, reactions: data.reactions } : c
        ));
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const getParentComment = (parentId) =>
    comments.find(c => c.id === parentId) || null;


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
        deadline: deadline || null,
        movement: selectedFlight.movement || null
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

  const distinctAirlines = Array.from(new Set(displayCases.map(c => c.airline))).filter(a => a !== '—');
  const hasMultipleAirlines = distinctAirlines.length > 1;

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
          {...navExtras}
        />
      <MainContent>
        <ContentArea>
          <div style={{ textAlign:'center', padding:'18px 0 10px' }}>
            <Title style={{ display:'inline-block', margin:0 }}>Mitigation Tracker Board</Title>
          </div>
          {userRole === 'AOC' && (() => {
            try {
              const user = JSON.parse(localStorage.getItem('user') || '{}');
              return user.airline ? (
                <div style={{
                  fontSize: 12,
                  color: '#64748b',
                  fontWeight: 500,
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <span style={{ fontSize: 14 }}>✈️</span>
                  <span>
                    Showing cases for <strong style={{ color: '#1A4B8F' }}>{user.airline}</strong> only
                  </span>
                </div>
              ) : null;
            } catch {
              return null;
            }
          })()}
          <TopBar>
            <Search placeholder="Search flights or airlines..." value={query} onChange={(e) => setQuery(e.target.value)} />
            
            <ChipGroup>
              <FilterChip active={activeSeverities.has('major')} severity="major" onClick={() => setActiveSeverities(prev => { const n = new Set(prev); n.has('major') ? n.delete('major') : n.add('major'); return n; })}>🔴 Major</FilterChip>
              <FilterChip active={activeSeverities.has('moderate')} severity="moderate" onClick={() => setActiveSeverities(prev => { const n = new Set(prev); n.has('moderate') ? n.delete('moderate') : n.add('moderate'); return n; })}>🟡 Moderate</FilterChip>
              <FilterChip active={activeSeverities.has('minor')} severity="minor" onClick={() => setActiveSeverities(prev => { const n = new Set(prev); n.has('minor') ? n.delete('minor') : n.add('minor'); return n; })}>🟢 Minor</FilterChip>
            </ChipGroup>

            {hasMultipleAirlines && (
              <ChipGroup>
                {distinctAirlines.map(airline => (
                  <FilterChip key={airline} active={activeAirlines.has(airline)} onClick={() => setActiveAirlines(prev => { const n = new Set(prev); n.has(airline) ? n.delete(airline) : n.add(airline); return n; })}>{airline}</FilterChip>
                ))}
              </ChipGroup>
            )}

            {(activeAirlines.size > 0 || activeSeverities.size > 0) && (
              <ClearLink onClick={() => { setActiveAirlines(new Set()); setActiveSeverities(new Set()); }}>Clear filters</ClearLink>
            )}

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
                                style={{ border:'1px solid #f9fafb', background:'#f9fafb', borderRadius:5, width:22, height:22, cursor:'pointer', fontSize:13, padding:0, lineHeight:1, color:'#555' }}
                                onClick={(e) => { e.stopPropagation(); setPendingMove({ id: c.id, from: c.column, to: prevCol }); }}
                              >←</button>
                            )}
                            {canEdit && nextCol && (
                              <button
                                title={`Move to ${nextTitle} →`}
                                style={{ border:'1px solid #f9fafb', background:'#f9fafb', borderRadius:5, width:22, height:22, cursor:'pointer', fontSize:13, padding:0, lineHeight:1, color:'#555' }}
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
        <ModalBackdrop onClick={() => {
          setOpenMenuCommentId(null);
          setEmojiPickerCommentId(null);
          setShowCommentsPanel(false);
        }}>
          <ModalCard style={{ maxWidth: 640, position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div style={{ fontWeight:800, color:'#333' }}>Chat</div>
              <button style={{ border:'none', background:'transparent', color:'#1A4B8F', cursor:'pointer' }} onClick={() => {
                setOpenMenuCommentId(null);
                setEmojiPickerCommentId(null);
                setShowCommentsPanel(false);
                setReplyingTo(null);
              }}>✕</button>
            </div>
            <div ref={chatDialogRef} style={{ border:'1px solid #eef1f4', borderRadius:8, display:'flex', flexDirection:'column', height: 420 }}>
              <div style={{ flex:1, overflow:'auto', padding:10, display:'flex', flexDirection:'column', gap:8 }}>
                {comments.map(c => {
                  const author = c.author_username || c.by || '';
                  const ts = c.created_at || c.at;
                  const isOwn = c.author_user_id === currentUserId;
                  return (
                    <div
                      key={c.id}
                      onMouseEnter={() => setHoveredCommentId(c.id)}
                      onMouseLeave={() => {
                        setHoveredCommentId(null);
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: isOwn ? 'row-reverse' : 'row',
                        alignItems: 'flex-end',
                        gap: 6,
                        marginBottom: 10,
                        position: 'relative',
                      }}
                    >
                      <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                        {c.parent_comment_id && (() => {
                          const parent = getParentComment(c.parent_comment_id);
                          return (
                            <div style={{
                              background: '#f1f5f9',
                              borderLeft: isOwn ? 'none' : '3px solid #94a3b8',
                              borderRight: isOwn ? '3px solid #94a3b8' : 'none',
                              borderRadius: 6,
                              padding: '3px 8px',
                              marginBottom: 2,
                              fontSize: 11,
                              color: '#64748b',
                              maxWidth: '100%',
                            }}>
                              <span style={{ fontWeight: 600 }}>
                                {parent ? parent.author_username : 'Deleted message'}
                              </span>
                              <div style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: 200,
                              }}>
                                {parent ? parent.comment_text : '[Message no longer available]'}
                              </div>
                            </div>
                          );
                        })()}

                        <div style={{ position: 'relative', width: '100%' }}>
                          <div style={{
                            background: isOwn ? '#1A4B8F' : '#f3f4f6',
                            color: isOwn ? '#fff' : '#1f2937',
                            borderRadius: isOwn ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                            padding: '8px 28px 8px 12px',
                            fontSize: 13,
                            lineHeight: 1.5,
                            wordBreak: 'break-word',
                          }}>
                            {!isOwn && (
                              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2, color: '#6b7280' }}>
                                {author}
                              </div>
                            )}
                            {c.comment_text || c.text}
                          </div>

                          {(hoveredCommentId === c.id || openMenuCommentId === c.id) && (
                            <button
                              data-comment-menu="true"
                              onClick={() => setOpenMenuCommentId(
                                openMenuCommentId === c.id ? null : c.id
                              )}
                              style={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 10,
                                color: isOwn ? 'rgba(255,255,255,0.7)' : '#9ca3af',
                                padding: '1px 3px',
                                lineHeight: 1,
                              }}
                            >
                              {openMenuCommentId === c.id ? '^' : 'v'}
                            </button>
                          )}

                          {openMenuCommentId === c.id && (
                            <div data-comment-menu="true" style={{
                              position: 'absolute',
                              top: '100%',
                              right: isOwn ? 0 : 'auto',
                              left: isOwn ? 'auto' : 0,
                              marginTop: 2,
                              background: '#ffffff',
                              border: '1px solid #e5e7eb',
                              borderRadius: 8,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                              zIndex: 100,
                              minWidth: 110,
                              padding: '4px 0',
                            }}>
                              <button
                                onClick={() => {
                                  setReplyingTo(c);
                                  setOpenMenuCommentId(null);
                                }}
                                style={{
                                  display: 'block', width: '100%', textAlign: 'left',
                                  padding: '7px 14px', border: 'none', background: 'transparent',
                                  cursor: 'pointer', fontSize: 13, color: '#374151',
                                }}
                              >
                                Reply
                              </button>
                              {isOwn && (
                                <button
                                  onClick={() => {
                                    handleDeleteComment(c.id);
                                    setOpenMenuCommentId(null);
                                  }}
                                  style={{
                                    display: 'block', width: '100%', textAlign: 'left',
                                    padding: '7px 14px', border: 'none', background: 'transparent',
                                    cursor: 'pointer', fontSize: 13, color: '#dc2626',
                                  }}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {(c.reactions || []).filter(r => (r.cnt || r.count || 0) > 0).length > 0 && (
                          <div style={{ display: 'flex', gap: 3, marginTop: 3, flexWrap: 'wrap' }}>
                            {(c.reactions || []).filter(r => (r.cnt || r.count || 0) > 0).map(r => {
                              const userReacted = r.userIds?.includes(currentUserId) || r.user_ids?.includes(currentUserId);
                              const reactionCount = r.cnt || r.count || 0;
                              return (
                                <button key={r.emoji}
                                  onClick={() => handleReaction(c.id, r.emoji)}
                                  style={{
                                    background: userReacted ? '#dbeafe' : '#f3f4f6',
                                    border: userReacted ? '1px solid #93c5fd' : '1px solid #e5e7eb',
                                    borderRadius: 12, padding: '1px 7px', cursor: 'pointer',
                                    fontSize: 11, display: 'flex', alignItems: 'center', gap: 2,
                                  }}
                                >
                                  {r.emoji} {reactionCount}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>
                          {ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'just now'}
                        </div>
                      </div>

                      {(hoveredCommentId === c.id || openMenuCommentId === c.id || emojiPickerCommentId === c.id) && (
                        <button
                          title="Add reaction"
                          onClick={() => setEmojiPickerCommentId(
                            emojiPickerCommentId === c.id ? null : c.id
                          )}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 2,
                            flexShrink: 0,
                            opacity: 0.6,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <img src="/icon8-weird-24.png" alt="react" width={18} height={18} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {emojiPickerCommentId !== null && (
                <div style={{
                  position: 'absolute',
                  bottom: 72,
                  right: 16,
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                  padding: '8px 12px',
                  display: 'flex',
                  gap: 8,
                  zIndex: 200,
                }}>
                  {['👍', '👎', '✅', '❌', '⚠️', '🔥', '👀'].map(emoji => (
                    <button key={emoji}
                      onClick={() => {
                        handleReaction(emojiPickerCommentId, emoji);
                        setEmojiPickerCommentId(null);
                      }}
                      style={{
                        fontSize: 20, background: 'transparent',
                        border: 'none', cursor: 'pointer', padding: 4,
                        borderRadius: 6,
                      }}
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ borderTop:'1px solid #eef1f4' }}>
                {replyingTo && (
                  <div style={{ background:'#f0f4ff', padding:'6px 10px', fontSize:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span>↩ Replying to {replyingTo.author_username}: "{(replyingTo.comment_text || '').slice(0, 40)}{(replyingTo.comment_text || '').length > 40 ? '...' : ''}"</span>
                    <button onClick={() => setReplyingTo(null)} style={{ border:'none', background:'transparent', cursor:'pointer', fontSize:14, color:'#555' }}>✕</button>
                  </div>
                )}
                <div style={{ padding:10, display:'flex', gap:8, alignItems:'center' }}>
                  <input
                    style={{ flex:1, padding:'10px 12px', border:'1px solid #e1e5e9', borderRadius:8 }}
                    placeholder="Type a message..."
                    id="panelCommentInput"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (e.currentTarget.value.trim()) {
                          addCommentHandler(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    title="Send"
                    style={{ border:'none', background:'#1A4B8F', color:'#fff', width:40, height:40, borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
                    onClick={() => { const input = document.getElementById('panelCommentInput'); if (input && input.value) { addCommentHandler(input.value); input.value=''; }}}
                  >
                    ➤
                  </button>
                </div>
              </div>
            </div>
          </ModalCard>
        </ModalBackdrop>
      )}

      {pendingMove && (
        <ModalBackdrop>
          <ModalCard>
            <div style={{ fontWeight:800, color:'#333', marginBottom:8 }}>Confirm Move</div>
            <div style={{ color:'#333' }}>Move <strong>{displayCases.find(c => c.id === pendingMove.id)?.flightNo}</strong> from <em>{columns.find(c => c.key === pendingMove.from)?.title}</em> → <em>{columns.find(c => c.key === pendingMove.to)?.title}</em>?</div>
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
          activeCaseIdRef.current = null;
          clearInterval(pollIntervalRef.current);
          if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
          setDrawerCase(null);
          setPropagationData(null);
          setPropagationLoading(false);
          setDrawerMode('view');
        }} />
      )}
      <DetailDrawer isOpen={!!drawerCase}>
        {drawerCase && drawerMode === 'view' && (() => {
          const base = displayCases.find(c => c.id === drawerCase.id) || drawerCase || {};
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
                  {[base.airline, base.route].filter(Boolean).join(' · ')}{base.movement === 'departure' ? ' · 🛫 Departure' : base.movement === 'arrival' ? ' · 🛬 Arrival' : ''}
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
                  {propagationLoading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#666', fontSize: 13 }}>
                      <div style={{ width: 16, height: 16, border: '2px solid #e1e5e9', borderTop: '2px solid #1A4B8F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      Loading connected flights...
                    </div>
                  )}
                  {!propagationLoading && (!propagationData || propagationData.length === 0) && (
                    <div style={{ color: '#999', fontSize: 13 }}>No connected flights detected.</div>
                  )}
                  {!propagationLoading && propagationData && propagationData.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {propagationData.map((flight, idx) => {
                        const severityColor =
                          flight.severity === 'major' ? '#dc2626' :
                          flight.severity === 'moderate' ? '#d97706' :
                          '#16a34a';
                        const severityBg =
                          flight.severity === 'major' ? '#fee2e2' :
                          flight.severity === 'moderate' ? '#fef3c7' :
                          '#dcfce7';
                        return (
                          <div
                            key={idx}
                            style={{
                              background: '#fff',
                              border: '1px solid #e1e5e9',
                              borderRadius: 8,
                              borderLeft: `3px solid ${severityColor}`,
                              padding: 12,
                              marginBottom: 0,
                            }}
                          >
                            <div style={{ fontWeight: 600, color: '#333', marginBottom: 6 }}>
                              {flight.flightNo}
                            </div>
                            <div style={{ color: '#666', fontSize: 12, marginBottom: 6 }}>
                              {flight.route}
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                              <span style={{ fontSize: 12, color: '#666' }}>
                                {flight.scheduledTime || '—'}
                              </span>
                              <span
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: 4,
                                  background: severityBg,
                                  color: severityColor,
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}
                              >
                                {flight.delayValue != null ? `+${flight.delayValue} min` : 'On Time'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <span
                                style={{
                                  fontSize: 11,
                                  padding: '3px 8px',
                                  borderRadius: 999,
                                  background: '#eef2ff',
                                  color: '#1A4B8F',
                                  fontWeight: 600,
                                }}
                              >
                                {flight.source || 'Propagated'}
                              </span>
                              <span
                                style={{
                                  fontSize: 11,
                                  padding: '3px 8px',
                                  borderRadius: 999,
                                  background: '#f1f5f9',
                                  color: '#1A4B8F',
                                  fontWeight: 600,
                                }}
                              >
                                {flight.status || 'Pending'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <style>{`
                    @keyframes spin {
                      to { transform: rotate(360deg); }
                    }
                  `}</style>
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
                  activeCaseIdRef.current = null;
                  clearInterval(pollIntervalRef.current);
                  if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
                  setDrawerCase(null);
                  setPropagationData(null);
                  setPropagationLoading(false);
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
                      {(() => {
                        const matches = boardFlights
                          .filter(f => (f.flightNo || '').toLowerCase().includes(flightQuery.toLowerCase()))
                          .filter(f => f.status !== 'On Time' && f.status !== 'Early')
                          .slice(0, 20);
                        if (matches.length === 0) return (
                          <div style={{ padding:10, color:'#999', fontSize:13 }}>No flights found</div>
                        );
                        return matches.map(f => (
                          <div key={f.flightNo + f.sched_utc}
                            style={{ padding:'8px 10px', cursor:'pointer', borderBottom:'1px solid #f5f5f5', display:'flex', flexDirection:'column', gap:2 }}
                            onClick={() => { setSelectedFlight(f); setFlightQuery(f.flightNo); }}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                              <span style={{ fontWeight:700, color:'#1A4B8F' }}>{f.flightNo}</span>
                              <span style={{
                                fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:999,
                                background: f.status === 'Major Delay' ? '#FEE2E2' : f.status === 'Minor Delay' ? '#FEF3C7' : '#f1f5f9',
                                color:      f.status === 'Major Delay' ? '#991B1B' : f.status === 'Minor Delay' ? '#92400E' : '#475569',
                              }}>{f.status}</span>
                            </div>
                            <div style={{ fontSize:12, color:'#666' }}>
                              {f.airline} · {f.route} · {f.scheduledTime || '—'}
                            </div>
                          </div>
                        ));
                      })()}
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
              <StyledDrawerButton onClick={() => { activeCaseIdRef.current = null; clearInterval(pollIntervalRef.current); if (wsRef.current) { wsRef.current.close(); wsRef.current = null; } setDrawerCase(null); setPropagationData(null); setPropagationLoading(false); setDrawerMode('view'); }}>Cancel</StyledDrawerButton>
              <StyledDrawerButton primary onClick={saveNewCase} disabled={!selectedFlight}>Save Case</StyledDrawerButton>
            </DrawerFooter>
          </>
        )}
      </DetailDrawer>

      {showClosed && (
        <ModalBackdrop onClick={() => setShowClosed(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <div style={{ fontWeight:800, color:'#333', marginBottom:8 }}>Closed Cases</div>
            {displayClosedCases.length === 0 ? (
              <div style={{ color:'#666' }}>No closed cases yet.</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight: '60vh', overflow:'auto' }}>
                {displayClosedCases.map(cc => (
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

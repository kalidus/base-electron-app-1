import React, { useState, useEffect, useRef } from 'react';
import { Menubar } from 'primereact/menubar';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { Tree } from 'primereact/tree';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dropdown } from 'primereact/dropdown';
import { Sidebar } from 'primereact/sidebar';
import { TabView, TabPanel } from 'primereact/tabview';
import { Terminal } from 'primereact/terminal';
import { TerminalService } from 'primereact/terminalservice';

const App = () => {
  const toast = useRef(null);
  const [folderName, setFolderName] = useState('');
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [parentNodeKey, setParentNodeKey] = useState(null);
  const [showSSHDialog, setShowSSHDialog] = useState(false);
  const [sshName, setSSHName] = useState('');
  const [sshHost, setSSHHost] = useState('');
  const [sshUser, setSSHUser] = useState('');
  const [sshTargetFolder, setSSHTargetFolder] = useState(null);
  const [showEditSSHDialog, setShowEditSSHDialog] = useState(false);
  const [editSSHNode, setEditSSHNode] = useState(null);
  const [editSSHName, setEditSSHName] = useState('');
  const [editSSHHost, setEditSSHHost] = useState('');
  const [editSSHUser, setEditSSHUser] = useState('');
  const [editSSHPassword, setEditSSHPassword] = useState('');
  const [editSSHRemoteFolder, setEditSSHRemoteFolder] = useState('');
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showEditFolderDialog, setShowEditFolderDialog] = useState(false);
  const [editFolderNode, setEditFolderNode] = useState(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [sshTabs, setSshTabs] = useState([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [sshPassword, setSSHPassword] = useState('');
  const [sshRemoteFolder, setSSHRemoteFolder] = useState('');

  // Storage key for persistence
  const STORAGE_KEY = 'basicapp2_tree_data';
  
  // Menu items for the top menubar
  const menuItems = [
    {
      label: 'Archivo',
      icon: 'pi pi-fw pi-file',
      items: [
        {
          label: 'Nuevo',
          icon: 'pi pi-fw pi-plus',
          items: [
            {
              label: 'Nueva Carpeta',
              icon: 'pi pi-fw pi-folder',
              command: () => openNewFolderDialog(null)
            },
            {
              label: 'Nuevo Archivo',
              icon: 'pi pi-fw pi-file'
            },
            {
              label: 'Nueva sesión SSH',
              icon: 'pi pi-fw pi-terminal',
              command: () => setShowSSHDialog(true)
            }
          ]
        },
        {
          label: 'Abrir',
          icon: 'pi pi-fw pi-folder-open'
        },
        {
          label: 'Guardar',
          icon: 'pi pi-fw pi-save'
        },
        {
          separator: true
        },
        {
          label: 'Salir',
          icon: 'pi pi-fw pi-power-off',
          command: () => {
            try {
              if (window && window.require) {
                const { ipcRenderer } = window.require('electron');
                ipcRenderer.send('app-quit');
              } else if (typeof window !== 'undefined' && window.navigator && window.navigator.userAgent.includes('Electron')) {
                window.require('electron').ipcRenderer.send('app-quit');
              } else {
                toast.current.show({
                  severity: 'info',
                  summary: 'Solo en escritorio',
                  detail: 'Esta opción solo está disponible en la app de escritorio (Electron).',
                  life: 3000
                });
              }
            } catch (e) {
              toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo cerrar la aplicación.',
                life: 3000
              });
            }
          }
        }
      ]
    },
    {
      label: 'Editar',
      icon: 'pi pi-fw pi-pencil',
      items: [
        {
          label: 'Cortar',
          icon: 'pi pi-fw pi-cut'
        },
        
        {
          label: 'Copiar',
          icon: 'pi pi-fw pi-copy'
        },
        {
          label: 'Pegar',
          icon: 'pi pi-fw pi-paste'
        }
      ]
    },
    {
      label: 'Ver',
      icon: 'pi pi-fw pi-eye',
      items: [
        {
          label: 'Panel lateral',
          icon: 'pi pi-fw pi-list'
        },
        {
          separator: true
        },
        {
          label: 'Resetear datos',
          icon: 'pi pi-fw pi-refresh',
          command: () => {
            const defaultNodes = getDefaultNodes();
            setNodes(defaultNodes);
            toast.current.show({
              severity: 'info',
              summary: 'Datos reseteados',
              detail: 'Se han restaurado los datos por defecto',
              life: 3000
            });
          }
        },
        {
          separator: true
        },
        {
          label: 'Regenerar keys',
          icon: 'pi pi-fw pi-wrench',
          command: () => {
            updateNodesWithKeys(nodes);
            toast.current.show({
              severity: 'success',
              summary: 'Keys regeneradas',
              detail: 'Se han regenerado todas las keys del árbol',
              life: 3000
            });
          }
        }
      ]
    },
    {
      label: 'Ayuda',
      icon: 'pi pi-fw pi-question-circle',
      items: [
        {
          label: 'Acerca de',
          icon: 'pi pi-fw pi-info-circle'
        }
      ]
    }
  ];

  // Default tree data
  const getDefaultNodes = () => [
    {
      key: '0',
      label: 'Proyectos',
      droppable: true,
      children: [
        {
          key: '0-0',
          label: 'Proyecto 1',
          droppable: true,
          children: [
            { key: '0-0-0', label: 'Archivo 1.txt', draggable: true },
            { key: '0-0-1', label: 'Archivo 2.txt', draggable: true }
          ]
        },
        {
          key: '0-1',
          label: 'Proyecto 2',
          droppable: true,
          children: [
            { key: '0-1-0', label: 'Archivo 3.txt', draggable: true }
          ]
        }
      ]
    },
    {
      key: '1',
      label: 'Documentos',
      droppable: true,
      children: [
        { key: '1-0', label: 'Documento 1.pdf', draggable: true },
        { key: '1-1', label: 'Documento 2.docx', draggable: true }
      ]
    }
  ];

  // Load initial data from localStorage or use defaults
  const loadInitialNodes = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('📂 Datos cargados desde localStorage:', parsed);
        return parsed;
      }
    } catch (error) {
      console.error('❌ Error cargando datos guardados:', error);
    }
    console.log('🆕 Usando datos por defecto');
    return getDefaultNodes();
  };

  // Tree data for the sidebar - loads from localStorage
  const [nodes, setNodes] = useState(() => loadInitialNodes());

  // Selected node in the tree
  const [selectedNodeKey, setSelectedNodeKey] = useState(null);

  // Track the currently dragged node
  const [draggedNodeKey, setDraggedNodeKey] = useState(null);

  // Auto-save to localStorage whenever nodes change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
      console.log('✅ Datos guardados automáticamente en localStorage');
    } catch (error) {
      console.error('❌ Error guardando datos:', error);
    }
  }, [nodes]); // Se ejecuta cada vez que cambia el estado 'nodes'

  // Function to create a deep copy of nodes
  const deepCopy = (obj) => {
    return JSON.parse(JSON.stringify(obj));
  };

  // Function to regenerate keys for the entire tree
  const regenerateKeys = (nodes, parentKey = null) => {
    return nodes.map((node, index) => {
      const newKey = parentKey ? `${parentKey}-${index}` : index.toString();
      const newNode = {
        ...node,
        key: newKey
      };
      
      if (node.children && node.children.length > 0) {
        newNode.children = regenerateKeys(node.children, newKey);
      }
      
      return newNode;
    });
  };

  // Helper function to update nodes with automatic key regeneration
  const updateNodesWithKeys = (newNodes, message = 'Operación completada') => {
    const nodesWithUpdatedKeys = regenerateKeys(newNodes);
    setNodes(nodesWithUpdatedKeys);
    return nodesWithUpdatedKeys;
  };

  // Function to find a node by key (recursive search)
  const findNodeByKey = (nodes, key) => {
    if (key === null) return null;
    
    for (let node of nodes) {
      if (node.key === key) {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const found = findNodeByKey(node.children, key);
        if (found) return found;
      }
    }
    return null;
  };

  // Function to find a node by UID (most robust)
  const findNodeByUID = (nodes, uid) => {
    for (let node of nodes) {
      if (node.uid === uid) {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const found = findNodeByUID(node.children, uid);
        if (found) return found;
      }
    }
    return null;
  };

  // Function to find parent and index by UID
  const findParentNodeAndIndexByUID = (nodes, uid) => {
    const searchInLevel = (currentNodes, parentNode = null) => {
      for (let i = 0; i < currentNodes.length; i++) {
        const node = currentNodes[i];
        if (node.uid === uid) {
          return { parent: parentNode, index: i, parentList: currentNodes, node: node };
        }
        if (node.children && node.children.length > 0) {
          const result = searchInLevel(node.children, node);
          if (result) return result;
        }
      }
      return null;
    };
    
    const result = searchInLevel(nodes);
    return result || { parent: null, index: -1, parentList: [], node: null };
  };

  // Function to find a node by unique properties (more robust than key-only search)
  const findNodeByProperties = (nodes, targetNode) => {
    for (let node of nodes) {
      if (node.label === targetNode.label && 
          node.icon === targetNode.icon && 
          node.droppable === targetNode.droppable) {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const found = findNodeByProperties(node.children, targetNode);
        if (found) return found;
      }
    }
    return null;
  };

  // Function to find parent node and index (recursive search)
  const findParentNodeAndIndex = (nodes, key) => {
    // Search recursively through all levels
    const searchInLevel = (currentNodes, parentNode = null) => {
      for (let i = 0; i < currentNodes.length; i++) {
        const node = currentNodes[i];
        if (node.key === key) {
          return { parent: parentNode, index: i, parentList: currentNodes };
        }
        if (node.children && node.children.length > 0) {
          const result = searchInLevel(node.children, node);
          if (result) return result;
        }
      }
      return null;
    };
    
    const result = searchInLevel(nodes);
    return result || { parent: null, index: -1, parentList: [] };
  };

  // Handle drop to root area
  const handleDropToRoot = (e) => {
    if (!draggedNodeKey) {
      return;
    }

    try {
      const nodesCopy = deepCopy(nodes);
      
      // Find and remove the dragged node from its current position
      const dragNodeInfo = findParentNodeAndIndex(nodesCopy, draggedNodeKey);
      if (dragNodeInfo.index === -1) {
        console.error("❌ Drag node not found for root drop:", draggedNodeKey);
        return;
      }
      
      const dragNode = dragNodeInfo.parentList[dragNodeInfo.index];
      
      // Remove from current position
      dragNodeInfo.parentList.splice(dragNodeInfo.index, 1);
      
      // Add to root level
      nodesCopy.push(dragNode);
      
      // Update nodes with key regeneration
      updateNodesWithKeys(nodesCopy);
      setDraggedNodeKey(null);
      
      toast.current.show({
        severity: 'success',
        summary: 'Éxito',
        detail: `"${dragNode.label}" movido a la raíz`,
        life: 3000
      });
    } catch (error) {
      console.error("❌ Error in drop to root:", error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: `Error al mover a la raíz: ${error.message}`,
        life: 5000
      });
    }
  };

  // Handle drag and drop with UID preservation
  const onDragDrop = (event) => {
    try {
      const dragNodeKey = event.dragNode.key;
      const dropNodeKey = event.dropNode ? event.dropNode.key : null;

      // Si dropNodeKey es null, es un drop en la raíz
      if (dropNodeKey === null) {
        const nodesCopy = deepCopy(nodes);
        let dragNodeInfo = findParentNodeAndIndex(nodesCopy, dragNodeKey);
        if (dragNodeInfo.index === -1) {
          toast.current.show({severity: 'error', summary: 'Error', detail: 'No se encontró el elemento a mover', life: 3000});
          return;
        }
        const [dragNode] = dragNodeInfo.parentList.splice(dragNodeInfo.index, 1);
        nodesCopy.push(dragNode);
        updateNodesWithKeys(nodesCopy, 'Nodo movido a la raíz');
        return;
      }

      // Lógica normal para drop entre nodos
      const nodesCopy = deepCopy(nodes);
      let dragNodeInfo = findParentNodeAndIndex(nodesCopy, dragNodeKey);
      if (dragNodeInfo.index === -1) {
        const originalDragInfo = findParentNodeAndIndex(nodes, dragNodeKey);
        if (originalDragInfo.index !== -1) {
          const originalNode = originalDragInfo.parentList[originalDragInfo.index];
          if (originalNode.uid) {
            dragNodeInfo = findParentNodeAndIndexByUID(nodesCopy, originalNode.uid);
          }
        }
      }
      if (dragNodeInfo.index === -1) {
        toast.current.show({severity: 'error', summary: 'Error', detail: 'No se encontró el elemento a mover', life: 3000});
        return;
      }
      const dragNode = dragNodeInfo.parentList[dragNodeInfo.index];
      if (!dragNode.uid && dragNode.isUserCreated) {
        dragNode.uid = `node_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
      }
      dragNodeInfo.parentList.splice(dragNodeInfo.index, 1);
      let dropNode = findNodeByKey(nodesCopy, dropNodeKey);
      if (!dropNode) {
        const originalDropNode = findNodeByKey(nodes, dropNodeKey);
        if (originalDropNode && originalDropNode.uid) {
          dropNode = findNodeByUID(nodesCopy, originalDropNode.uid);
        }
      }
      if (!dropNode) {
        nodesCopy.push(dragNode);
        updateNodesWithKeys(nodesCopy, 'Nodo movido a la raíz');
        return;
      }
      if (!dropNode.children) {
        dropNode.children = [];
      }
      dropNode.children.push(dragNode);
      updateNodesWithKeys(nodesCopy, 'Nodo movido');
    } catch (error) {
      console.error('Error en drag & drop:', error);
      toast.current.show({severity: 'error', summary: 'Error', detail: `Error en drag & drop: ${error.message}`, life: 5000});
    }
  };
  
  // Generate next key based on parent key (simplified - will be regenerated anyway)
  const generateNextKey = (parentKey) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    
    if (parentKey === null) {
      // Root level - use timestamp for uniqueness
      return `temp_root_${timestamp}_${random}`;
    } else {
      // Child level - use parent key + timestamp for uniqueness
      return `temp_child_${parentKey}_${timestamp}_${random}`;
    }
  };
  
  // Open dialog to create a new folder
  const openNewFolderDialog = (parentKey) => {
    setParentNodeKey(parentKey);
    setFolderName('');
    setShowFolderDialog(true);
  };
  
  // Create a new folder
  const createNewFolder = () => {
    if (!folderName.trim()) {
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'El nombre de carpeta no puede estar vacío',
        life: 3000
      });
      return;
    }
    
    try {
      const newKey = generateNextKey(parentNodeKey);
      
      const newFolder = {
        key: newKey,
        label: folderName.trim(),
        droppable: true,
        children: [],
        // Add unique persistent identifier
        uid: `node_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
        createdAt: new Date().toISOString(),
        isUserCreated: true
      };
      
      const nodesCopy = deepCopy(nodes);
      
      if (parentNodeKey === null) {
        // Add to root level
        nodesCopy.push(newFolder);
      } else {
        // Add to specific parent
        const parentNode = findNodeByKey(nodesCopy, parentNodeKey);
        
        if (!parentNode) {
          throw new Error(`Parent node with key ${parentNodeKey} not found`);
        }
        
        parentNode.children = parentNode.children || [];
        parentNode.children.push(newFolder);
      }
      
      updateNodesWithKeys(nodesCopy);
      setShowFolderDialog(false);
      toast.current.show({
        severity: 'success',
        summary: 'Éxito',
        detail: `Carpeta "${folderName}" creada con keys actualizadas`,
        life: 3000
      });
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo crear la carpeta',
        life: 3000
      });
    }
  };
  
  // Delete node (folder or file) with multiple search strategies
  const deleteNode = (nodeKey) => {
    try {
      const nodesCopy = deepCopy(nodes);
      
      // Strategy 1: Try finding by key first
      let nodeInfo = findParentNodeAndIndex(nodesCopy, nodeKey);
      
      // Strategy 2: If key search fails, try finding by UID or properties
      if (nodeInfo.index === -1) {
        // First get the original node from current state to extract UID
        const originalNodeInfo = findParentNodeAndIndex(nodes, nodeKey);
        if (originalNodeInfo.index !== -1) {
          const originalNode = originalNodeInfo.parentList[originalNodeInfo.index];
          
          if (originalNode.uid) {
            nodeInfo = findParentNodeAndIndexByUID(nodesCopy, originalNode.uid);
          }
          
          // Strategy 3: If UID also fails, try by properties
          if (nodeInfo.index === -1) {
            const foundNode = findNodeByProperties(nodesCopy, originalNode);
            if (foundNode) {
              nodeInfo = findParentNodeAndIndex(nodesCopy, foundNode.key);
            }
          }
        }
      }
      
      if (nodeInfo.index === -1) {
        console.error("❌ Node not found with any strategy:", nodeKey);
        toast.current.show({
          severity: 'error',
          summary: 'Error',
          detail: `No se encontró el elemento para eliminar. Key: ${nodeKey}`,
          life: 5000
        });
        return;
      }
      
      // Get node before deletion
      const nodeToDelete = nodeInfo.parentList[nodeInfo.index];
      const nodeName = nodeToDelete.label;
      
      // Remove the node from its parent
      nodeInfo.parentList.splice(nodeInfo.index, 1);
      
      // Update the state with automatic key regeneration
      updateNodesWithKeys(nodesCopy);
      
      // If the deleted node was selected, clear selection
      if (selectedNodeKey && Object.keys(selectedNodeKey)[0] === nodeKey) {
        setSelectedNodeKey(null);
      }
      
      toast.current.show({
        severity: 'success',
        summary: 'Éxito',
        detail: `"${nodeName}" eliminado correctamente`,
        life: 3000
      });
    } catch (error) {
      console.error("❌ Error deleting node:", error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: `Error al eliminar: ${error.message}`,
        life: 5000
      });
    }
  };
  
  // Confirm node deletion
  const confirmDeleteNode = (nodeKey, nodeName, hasChildren) => {
    const message = hasChildren
      ? `¿Estás seguro de que deseas eliminar la carpeta "${nodeName}" y todo su contenido?`
      : `¿Estás seguro de que deseas eliminar "${nodeName}"?`;
    
    confirmDialog({
      message: message,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: () => deleteNode(nodeKey),
      reject: () => {}
    });
  };
  
  // Node context menu
  const nodeTemplate = (node, options) => {
    const isFolder = node.droppable;
    const hasChildren = isFolder && node.children && node.children.length > 0;
    const isSSH = node.data && node.data.type === 'ssh';
    let iconClass = '';
    if (isSSH) {
      iconClass = 'pi pi-desktop';
    } else if (isFolder) {
      iconClass = options.expanded ? 'pi pi-folder-open' : 'pi pi-folder';
    }
    return (
      <div className="flex align-items-center gap-2"
        onContextMenu={(e) => onNodeContextMenu(e, node)}
        onDoubleClick={isSSH ? (e) => {
          e.stopPropagation();
          openSshTab({host: node.data.host, user: node.data.user, password: node.data.password, label: node.label, ...node.data});
        } : undefined}
      >
        <span className={iconClass} style={{ minWidth: 20 }}></span>
        <span className="node-label">{node.label}</span>
        <div className="ml-auto flex">
          {isSSH && (
            <Button
              icon="pi pi-pencil"
              rounded
              text
              size="small"
              className="node-action-button"
              onClick={e => {
                e.stopPropagation();
                openEditSSHDialog(node);
              }}
              tooltip="Editar sesión SSH"
              tooltipOptions={{ position: 'top' }}
            />
          )}
          {isFolder && (
            <>
              <Button
                icon="pi pi-pencil"
                rounded
                text
                size="small"
                className="node-action-button"
                onClick={e => {
                  e.stopPropagation();
                  openEditFolderDialog(node);
                }}
                tooltip="Editar carpeta"
                tooltipOptions={{ position: 'top' }}
              />
              <Button 
                icon="pi pi-plus" 
                rounded 
                text 
                size="small" 
                className="node-action-button"
                onClick={(e) => {
                  e.stopPropagation();
                  openNewFolderDialog(node.key);
                }}
                tooltip="Crear carpeta"
                tooltipOptions={{ position: 'top' }}
              />
            </>
          )}
          <Button 
            icon="pi pi-trash" 
            rounded 
            text 
            severity="danger" 
            size="small" 
            className="node-action-button ml-1"
            onClick={(e) => {
              e.stopPropagation();
              confirmDeleteNode(node.key, node.label, hasChildren);
            }}
            tooltip="Eliminar"
            tooltipOptions={{ position: 'top' }}
          />
        </div>
      </div>
    );
  };

  // Context menu for nodes
  const onNodeContextMenu = (event, node) => {
    event.preventDefault();
    // Aquí podrías mostrar un menú contextual (se implementará después)
  };

  // Función recursiva para obtener todas las carpetas del árbol
  const getAllFolders = (nodes, prefix = '') => {
    let folders = [];
    for (const node of nodes) {
      if (node.droppable) {
        folders.push({ label: prefix + node.label, value: node.key });
        if (node.children && node.children.length > 0) {
          folders = folders.concat(getAllFolders(node.children, prefix + node.label + ' / '));
        }
      }
    }
    return folders;
  };

  // Función para crear una nueva conexión SSH
  const createNewSSH = () => {
    if (!sshName.trim() || !sshHost.trim() || !sshUser.trim() || !sshPassword.trim()) {
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Todos los campos son obligatorios',
        life: 3000
      });
      return;
    }
    const newKey = generateNextKey(sshTargetFolder);
    const newSSHNode = {
      key: newKey,
      label: sshName.trim(),
      data: {
        host: sshHost.trim(),
        user: sshUser.trim(),
        password: sshPassword.trim(),
        remoteFolder: sshRemoteFolder.trim(),
        type: 'ssh'
      },
      draggable: true,
      uid: `ssh_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      createdAt: new Date().toISOString(),
      isUserCreated: true
    };
    const nodesCopy = deepCopy(nodes);
    if (sshTargetFolder) {
      const parentNode = findNodeByKey(nodesCopy, sshTargetFolder);
      if (parentNode) {
        parentNode.children = parentNode.children || [];
        parentNode.children.push(newSSHNode);
      } else {
        nodesCopy.push(newSSHNode);
      }
    } else {
      nodesCopy.push(newSSHNode);
    }
    updateNodesWithKeys(nodesCopy);
    setShowSSHDialog(false);
    setSSHName(''); setSSHHost(''); setSSHUser(''); setSSHTargetFolder(null); setSSHPassword(''); setSSHRemoteFolder('');
    toast.current.show({
      severity: 'success',
      summary: 'SSH añadida',
      detail: `Conexión SSH "${sshName}" añadida al árbol`,
      life: 3000
    });
  };

  // Función para abrir el diálogo de edición SSH
  const openEditSSHDialog = (node) => {
    setEditSSHNode(node);
    setEditSSHName(node.label);
    setEditSSHHost(node.data?.host || '');
    setEditSSHUser(node.data?.user || '');
    setEditSSHPassword(node.data?.password || '');
    setEditSSHRemoteFolder(node.data?.remoteFolder || '');
    setShowEditSSHDialog(true);
  };

  // Función para guardar la edición SSH
  const saveEditSSH = () => {
    if (!editSSHName.trim() || !editSSHHost.trim() || !editSSHUser.trim() || !editSSHPassword.trim()) {
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Todos los campos son obligatorios excepto la carpeta remota',
        life: 3000
      });
      return;
    }
    const nodesCopy = deepCopy(nodes);
    const nodeToEdit = findNodeByKey(nodesCopy, editSSHNode.key);
    if (nodeToEdit) {
      nodeToEdit.label = editSSHName.trim();
      nodeToEdit.data = { 
        ...nodeToEdit.data, 
        host: editSSHHost.trim(), 
        user: editSSHUser.trim(),
        password: editSSHPassword.trim(),
        remoteFolder: editSSHRemoteFolder.trim(),
        type: 'ssh'
      };
    }
    updateNodesWithKeys(nodesCopy);
    setShowEditSSHDialog(false);
    setEditSSHNode(null);
    setEditSSHName(''); 
    setEditSSHHost(''); 
    setEditSSHUser('');
    setEditSSHPassword('');
    setEditSSHRemoteFolder('');
    toast.current.show({
      severity: 'success',
      summary: 'SSH editada',
      detail: `Sesión SSH actualizada`,
      life: 3000
    });
  };

  // Función para abrir el diálogo de edición de carpeta
  const openEditFolderDialog = (node) => {
    setEditFolderNode(node);
    setEditFolderName(node.label);
    setShowEditFolderDialog(true);
  };

  // Función para guardar la edición de la carpeta
  const saveEditFolder = () => {
    if (!editFolderName.trim()) {
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'El nombre de la carpeta no puede estar vacío',
        life: 3000
      });
      return;
    }
    const nodesCopy = deepCopy(nodes);
    const nodeToEdit = findNodeByKey(nodesCopy, editFolderNode.key);
    if (nodeToEdit) {
      nodeToEdit.label = editFolderName.trim();
    }
    updateNodesWithKeys(nodesCopy);
    setShowEditFolderDialog(false);
    setEditFolderNode(null);
    setEditFolderName('');
    toast.current.show({
      severity: 'success',
      summary: 'Carpeta editada',
      detail: `Nombre actualizado`,
      life: 3000
    });
  };

  // Al inicio del componente
  let ipcRenderer = null;
  try {
    if (window && window.require) {
      ipcRenderer = window.require('electron').ipcRenderer;
    }
  } catch (e) {}

  // Generar un ID único para cada conexión
  const generateConnectionId = () => `ssh_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

  // Función para abrir una nueva pestaña SSH y conectar
  const openSshTab = async (tabData) => {
    const connectionId = generateConnectionId();
    console.log('Intentando abrir conexión SSH:', { host: tabData.host, user: tabData.user, connectionId });
    
    // Crear la pestaña en estado "conectando"
    setSshTabs(prevTabs => {
      const newTab = {
        ...tabData,
        key: connectionId,
        connectionId,
        label: `${tabData.label || tabData.user + '@' + tabData.host}`,
        sshStatus: 'connecting',
        sshError: null
      };
      setActiveTabIndex(prevTabs.length);
      return [...prevTabs, newTab];
    });

    if (!ipcRenderer) {
      console.error('ipcRenderer no está disponible');
      setSshTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.connectionId === connectionId 
            ? { ...tab, sshStatus: 'error', sshError: 'No se puede conectar: ipcRenderer no disponible' }
            : tab
        )
      );
      return;
    }

    try {
      console.log('Enviando solicitud de conexión SSH al proceso principal...');
      const response = await ipcRenderer.invoke('ssh-connect', {
        connectionId,
        host: tabData.host,
        username: tabData.user,
        password: tabData.password
      });
      console.log('Respuesta de conexión SSH:', response);

      if (response.success) {
        console.log('Conexión SSH exitosa');
        setSshTabs(prevTabs => 
          prevTabs.map(tab => 
            tab.connectionId === connectionId 
              ? { ...tab, sshStatus: 'connected' }
              : tab
          )
        );
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error en la conexión SSH:', error);
      setSshTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.connectionId === connectionId 
            ? { ...tab, sshStatus: 'error', sshError: error.message }
            : tab
        )
      );
    }
  };

  // Función para manejar comandos en el terminal
  const handleCommand = async (connectionId, command) => {
    if (!ipcRenderer) {
      console.error('No se puede ejecutar el comando: ipcRenderer no disponible');
      TerminalService.emit('response', { 
        response: 'Error: No se puede ejecutar el comando - ipcRenderer no disponible' 
      });
      return;
    }
    
    try {
      console.log(`Ejecutando comando SSH (${connectionId}):`, command);
      const response = await ipcRenderer.invoke('ssh-exec', { connectionId, command });
      console.log(`Respuesta del comando SSH (${connectionId}):`, response);
      
      if (response.success) {
        // Emitir el comando primero
        TerminalService.emit('response', { response: command });
        
        // Luego emitir la salida
        const output = response.stdout || response.stderr || '(No output)';
        console.log(`Salida del comando (${connectionId}):`, output);
        
        // Asegurar que hay un salto de línea antes y después de la salida
        TerminalService.emit('response', { 
          response: `\n${output}\n`
        });
      } else {
        // En caso de error, mostrar el comando y el error
        TerminalService.emit('response', { response: command });
        TerminalService.emit('response', { 
          response: `\nError: ${response.message}\n` 
        });
      }
    } catch (error) {
      console.error(`Error ejecutando comando SSH (${connectionId}):`, error);
      TerminalService.emit('response', { response: command });
      TerminalService.emit('response', { 
        response: `\nError executing command: ${error.message}\n` 
      });
    }
  };

  // Componente Terminal SSH
  const SSHTerminal = ({ connectionId, status, error, host, user }) => {
    const terminalRef = useRef(null);
    const [terminal, setTerminal] = useState(null);
    const [fitAddon, setFitAddon] = useState(null);

    useEffect(() => {
      const setupTerminal = async () => {
        try {
          const { Terminal } = await import('@xterm/xterm');
          const { FitAddon } = await import('@xterm/addon-fit');
          
          // Import terminal styles
          await import('@xterm/xterm/css/xterm.css');
          
          const term = new Terminal({
            cursorBlink: true,
            cursorStyle: 'block',
            fontSize: 14,
            fontFamily: 'Consolas, monospace',
            theme: {
              background: '#1e1e1e',
              foreground: '#ffffff'
            },
            allowProposedApi: true,
            convertEol: true,
            scrollback: 5000
          });

          const fit = new FitAddon();
          term.loadAddon(fit);
          
          if (terminalRef.current) {
            // Clear terminal container before opening
            terminalRef.current.innerHTML = '';
            term.open(terminalRef.current);
            fit.fit();
            term.focus();
            
            // Handle window resize
            const handleResize = () => {
              fit.fit();
              if (window.require) {
                const { ipcRenderer } = window.require('electron');
                ipcRenderer.invoke('ssh-resize', {
                  connectionId,
                  rows: term.rows,
                  cols: term.cols
                });
              }
            };
            
            window.addEventListener('resize', handleResize);
            
            // Handle terminal input
            term.onData(data => {
              if (window.require) {
                const { ipcRenderer } = window.require('electron');
                ipcRenderer.invoke('ssh-write', { connectionId, data })
                  .catch(err => {
                    console.error('Error writing to terminal:', err);
                    term.write(`\r\nError: ${err.message}\r\n`);
                  });
              }
            });

            // Handle terminal data from main process
            if (window.require) {
              const { ipcRenderer } = window.require('electron');
              
              const dataHandler = (event, data) => {
                if (term && data) {
                  term.write(data);
                }
              };

              const closeHandler = () => {
                if (term) {
                  term.write('\r\n\x1b[31mConnection closed\x1b[0m\r\n');
                }
              };

              ipcRenderer.on(`ssh-data-${connectionId}`, dataHandler);
              ipcRenderer.on(`ssh-close-${connectionId}`, closeHandler);

              // Cleanup listeners on unmount
              return () => {
                window.removeEventListener('resize', handleResize);
                ipcRenderer.removeListener(`ssh-data-${connectionId}`, dataHandler);
                ipcRenderer.removeListener(`ssh-close-${connectionId}`, closeHandler);
                term.dispose();
              };
            }

            setTerminal(term);
            setFitAddon(fit);
          }
        } catch (error) {
          console.error('Error setting up terminal:', error);
          if (terminalRef.current) {
            terminalRef.current.innerHTML = `Error: ${error.message}`;
          }
        }
      };

      setupTerminal();
    }, [connectionId]);

    // Show error state if present
    useEffect(() => {
      if (error && terminal) {
        terminal.write(`\r\n\x1b[31mError: ${error}\x1b[0m\r\n`);
      }
    }, [error, terminal]);

    return (
      <div 
        ref={terminalRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          padding: '8px',
          backgroundColor: '#1e1e1e'
        }} 
        onClick={() => terminal?.focus()}
      />
    );
  };

  // En el renderizado de las pestañas
  const renderTabContent = (tab) => {
    if (tab.type === 'ssh') {
      return (
        <SSHTerminal
          connectionId={tab.connectionId}
          status={tab.sshStatus}
          error={tab.sshError}
          host={tab.host}
          user={tab.user}
        />
      );
    }
    // ... resto del código de renderizado ...
  };

  // Al cerrar una pestaña SSH, cerrar la conexión
  const handleTabClose = (e) => {
    const closedTab = sshTabs[e.index];
    if (closedTab && closedTab.connectionId) {
      ipcRenderer.invoke('ssh-disconnect', { connectionId: closedTab.connectionId });
    }
    setSshTabs(prevTabs => prevTabs.filter((_, i) => i !== e.index));
    setActiveTabIndex(0);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Toast ref={toast} />
      <ConfirmDialog />
      {/* Top menubar */}
      <Menubar model={menuItems} />
      
      {/* Main content with splitter */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Splitter style={{ height: '100%' }}>
          {/* Left sidebar with tree */}
          <SplitterPanel size={25} minSize={20} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {/* Barra superior del panel lateral con buscador e iconos */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 0.5rem 0.25rem 0.5rem', gap: '0.5rem' }}>
                <span style={{ flex: 1 }}>
                  {/* El filtro del árbol se renderiza automáticamente, pero aquí podemos poner un input si se quiere personalizar */}
                </span>
                <Button
                  icon="pi pi-plus"
                  className="p-button-rounded p-button-text sidebar-action-button"
                  style={{ marginRight: '0.25rem' }}
                  onClick={() => openNewFolderDialog(null)}
                  tooltip="Crear carpeta"
                  tooltipOptions={{ position: 'bottom' }}
                />
                <Button
                  icon="pi pi-server"
                  className="p-button-rounded p-button-text sidebar-action-button"
                  onClick={() => setShowSSHDialog(true)}
                  tooltip="Nueva conexión SSH"
                  tooltipOptions={{ position: 'bottom' }}
                />
                <Button
                  icon="pi pi-cog"
                  className="p-button-rounded p-button-text sidebar-action-button"
                  onClick={() => setShowConfigDialog(true)}
                  tooltip="Configuración"
                  tooltipOptions={{ position: 'bottom' }}
                />
              </div>
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
                <Tree
                  value={nodes}
                  selectionMode="single"
                  selectionKeys={selectedNodeKey}
                  onSelectionChange={e => setSelectedNodeKey(e.value)}
                  dragdropScope="files"
                  onDragDrop={onDragDrop}
                  onDragStart={e => setDraggedNodeKey(e.node.key)}
                  onDragEnd={() => {}}
                  className="sidebar-tree"
                  nodeTemplate={nodeTemplate}
                  filter
                  filterMode="strict"
                  filterPlaceholder="Buscar..."
                />
              </div>
            </div>
          </SplitterPanel>
          
          {/* Main content area */}
          <SplitterPanel size={75} style={{ padding: '1rem', overflow: 'auto' }}>
            {sshTabs.length > 0 ? (
              <TabView 
                activeIndex={activeTabIndex} 
                onTabChange={(e) => setActiveTabIndex(e.index)}
                pt={{
                  root: { className: 'w-full' },
                  navContainer: { className: 'bg-white border-bottom-1 border-300' },
                  nav: { className: 'gap-2 px-3' },
                  inkbar: { 
                    className: 'bg-primary-500',
                    style: { height: '2px', bottom: '0', backgroundColor: 'var(--primary-color)' }
                  },
                  tab: {
                    className: ({ state }) => ({
                      'inline-flex items-center px-3 py-2 text-primary hover:text-primary-600 hover:bg-primary-50 transition-colors transition-duration-150 rounded-lg': true,
                      'bg-primary-50 text-primary-600': state.isActive
                    })
                  }
                }}
                scrollable
              >
                {sshTabs.map((tab) => (
                  <TabPanel 
                    key={tab.key} 
                    header={tab.label} 
                    closable
                    pt={{
                      content: { className: 'surface-ground' },
                      headerAction: { className: 'px-3 py-2' }
                    }}
                  >
                    <div className="ssh-terminal-container" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
                      <div className="terminal-wrapper" style={{ flex: 1, backgroundColor: '#1e1e1e', borderRadius: '6px', padding: '1rem' }}>
                        {renderTabContent(tab)}
                      </div>
                    </div>
                  </TabPanel>
                ))}
              </TabView>
            ) : (
              <Card title="Contenido Principal">
                <p className="m-0">
                  Bienvenido a la aplicación de escritorio. Seleccione un archivo del panel lateral para ver su contenido.
                </p>
                {selectedNodeKey && (
                  <div className="mt-3">
                    <p>Elemento seleccionado: {Object.keys(selectedNodeKey)[0]}</p>
                  </div>
                )}
                <div className="mt-3">
                  <p>Puedes arrastrar y soltar elementos en el panel lateral para reorganizarlos.</p>
                  <p>Haz clic en el botón "+" para crear carpetas nuevas.</p>
                  <p>Para eliminar un elemento, haz clic en el botón de la papelera que aparece al pasar el ratón.</p>
                </div>
              </Card>
            )}
          </SplitterPanel>
        </Splitter>
      </div>
      
      {/* Dialog for creating new folder */}
      <Dialog 
        header="Crear Nueva Carpeta" 
        visible={showFolderDialog} 
        style={{ width: '30rem' }}
        onHide={() => setShowFolderDialog(false)}
        footer={(
          <div>
            <Button label="Cancelar" icon="pi pi-times" onClick={() => setShowFolderDialog(false)} className="p-button-text" />
            <Button label="Crear" icon="pi pi-check" onClick={createNewFolder} autoFocus />
          </div>
        )}
      >
        <div className="p-fluid">
          <div className="p-field">
            <label htmlFor="folderName">Nombre de la carpeta</label>
            <InputText
              id="folderName"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') createNewFolder();
              }}
            />
          </div>
        </div>
      </Dialog>

      {/* Dialog para nueva sesión SSH */}
      <Dialog
        header="Nueva sesión SSH"
        visible={showSSHDialog}
        style={{ width: '25rem' }}
        onHide={() => setShowSSHDialog(false)}
        footer={
          <div>
            <Button label="Cancelar" icon="pi pi-times" onClick={() => setShowSSHDialog(false)} className="p-button-text" />
            <Button label="Crear" icon="pi pi-check" onClick={createNewSSH} autoFocus />
          </div>
        }
      >
        <div className="p-fluid">
          <div className="p-field">
            <label htmlFor="sshName">Nombre</label>
            <InputText id="sshName" value={sshName} onChange={e => setSSHName(e.target.value)} autoFocus />
          </div>
          <div className="p-field">
            <label htmlFor="sshHost">Host</label>
            <InputText id="sshHost" value={sshHost} onChange={e => setSSHHost(e.target.value)} />
          </div>
          <div className="p-field">
            <label htmlFor="sshUser">Usuario</label>
            <InputText id="sshUser" value={sshUser} onChange={e => setSSHUser(e.target.value)} />
          </div>
          <div className="p-field">
            <label htmlFor="sshPassword">Contraseña</label>
            <InputText id="sshPassword" type="password" value={sshPassword} onChange={e => setSSHPassword(e.target.value)} />
          </div>
          <div className="p-field">
            <label htmlFor="sshRemoteFolder">Carpeta remota</label>
            <InputText id="sshRemoteFolder" value={sshRemoteFolder} onChange={e => setSSHRemoteFolder(e.target.value)} placeholder="/home/usuario" />
          </div>
          <div className="p-field">
            <label htmlFor="sshTargetFolder">Carpeta destino</label>
            <Dropdown id="sshTargetFolder" value={sshTargetFolder} options={getAllFolders(nodes)} onChange={e => setSSHTargetFolder(e.value)} placeholder="Selecciona una carpeta (opcional)" showClear filter />
          </div>
        </div>
      </Dialog>

      {/* Dialog para editar sesión SSH */}
      <Dialog
        header="Editar sesión SSH"
        visible={showEditSSHDialog}
        style={{ width: '25rem' }}
        onHide={() => setShowEditSSHDialog(false)}
        footer={
          <div>
            <Button label="Cancelar" icon="pi pi-times" onClick={() => setShowEditSSHDialog(false)} className="p-button-text" />
            <Button label="Guardar" icon="pi pi-check" onClick={saveEditSSH} autoFocus />
          </div>
        }
      >
        <div className="p-fluid">
          <div className="p-field">
            <label htmlFor="editSSHName">Nombre</label>
            <InputText id="editSSHName" value={editSSHName} onChange={e => setEditSSHName(e.target.value)} autoFocus />
          </div>
          <div className="p-field">
            <label htmlFor="editSSHHost">Host</label>
            <InputText id="editSSHHost" value={editSSHHost} onChange={e => setEditSSHHost(e.target.value)} />
          </div>
          <div className="p-field">
            <label htmlFor="editSSHUser">Usuario</label>
            <InputText id="editSSHUser" value={editSSHUser} onChange={e => setEditSSHUser(e.target.value)} />
          </div>
          <div className="p-field">
            <label htmlFor="editSSHPassword">Contraseña</label>
            <InputText id="editSSHPassword" type="password" value={editSSHPassword} onChange={e => setEditSSHPassword(e.target.value)} />
          </div>
          <div className="p-field">
            <label htmlFor="editSSHRemoteFolder">Carpeta remota</label>
            <InputText id="editSSHRemoteFolder" value={editSSHRemoteFolder} onChange={e => setEditSSHRemoteFolder(e.target.value)} placeholder="/home/usuario" />
          </div>
        </div>
      </Dialog>

      {/* Dialog de configuración */}
      <Dialog
        header="Configuración de la aplicación"
        visible={showConfigDialog}
        style={{ width: '25rem' }}
        onHide={() => setShowConfigDialog(false)}
        footer={
          <div>
            <Button label="Cerrar" icon="pi pi-times" onClick={() => setShowConfigDialog(false)} className="p-button-text" />
          </div>
        }
      >
        <div className="p-fluid">
          <div className="p-field">
            <p>Aquí puedes agregar opciones de configuración de la aplicación.</p>
          </div>
        </div>
      </Dialog>

      {/* Dialog para editar carpeta */}
      <Dialog
        header="Editar carpeta"
        visible={showEditFolderDialog}
        style={{ width: '25rem' }}
        onHide={() => setShowEditFolderDialog(false)}
        footer={
          <div>
            <Button label="Cancelar" icon="pi pi-times" onClick={() => setShowEditFolderDialog(false)} className="p-button-text" />
            <Button label="Guardar" icon="pi pi-check" onClick={saveEditFolder} autoFocus />
          </div>
        }
      >
        <div className="p-fluid">
          <div className="p-field">
            <label htmlFor="editFolderName">Nombre de la carpeta</label>
            <InputText id="editFolderName" value={editFolderName} onChange={e => setEditFolderName(e.target.value)} autoFocus />
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default App; 
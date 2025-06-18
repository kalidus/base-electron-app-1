import React, { useState } from 'react';
import { Menubar } from 'primereact/menubar';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { Tree } from 'primereact/tree';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

const App = () => {
  const toast = useRef(null);
  const [folderName, setFolderName] = useState('');
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [parentNodeKey, setParentNodeKey] = useState(null);
  
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
          icon: 'pi pi-fw pi-power-off'
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

  // Tree data for the sidebar
  const [nodes, setNodes] = useState([
    {
      key: '0',
      label: 'Proyectos',
      icon: 'pi pi-fw pi-folder',
      droppable: true,
      children: [
        {
          key: '0-0',
          label: 'Proyecto 1',
          icon: 'pi pi-fw pi-folder',
          droppable: true,
          children: [
            { key: '0-0-0', label: 'Archivo 1.txt', icon: 'pi pi-fw pi-file', draggable: true },
            { key: '0-0-1', label: 'Archivo 2.txt', icon: 'pi pi-fw pi-file', draggable: true }
          ]
        },
        {
          key: '0-1',
          label: 'Proyecto 2',
          icon: 'pi pi-fw pi-folder',
          droppable: true,
          children: [
            { key: '0-1-0', label: 'Archivo 3.txt', icon: 'pi pi-fw pi-file', draggable: true }
          ]
        }
      ]
    },
    {
      key: '1',
      label: 'Documentos',
      icon: 'pi pi-fw pi-folder',
      droppable: true,
      children: [
        { key: '1-0', label: 'Documento 1.pdf', icon: 'pi pi-fw pi-file-pdf', draggable: true },
        { key: '1-1', label: 'Documento 2.docx', icon: 'pi pi-fw pi-file', draggable: true }
      ]
    }
  ]);

  // Selected node in the tree
  const [selectedNodeKey, setSelectedNodeKey] = useState(null);

  // Function to create a deep copy of nodes
  const deepCopy = (obj) => {
    return JSON.parse(JSON.stringify(obj));
  };

  // Function to find a node by key
  const findNodeByKey = (nodes, key) => {
    // Handle root level nodes
    if (key === null) {
      return null;
    }
    
    if (key.indexOf('-') === -1) {
      return nodes.find(node => node.key === key);
    }
    
    const parts = key.split('-');
    let currentNodes = nodes;
    let currentNode = null;
    
    // Navigate through the tree
    for (let i = 0; i < parts.length; i++) {
      const currentKey = parts.slice(0, i + 1).join('-');
      currentNode = currentNodes.find(node => node.key === currentKey);
      
      if (!currentNode) return null;
      if (i < parts.length - 1) {
        currentNodes = currentNode.children || [];
      }
    }
    
    return currentNode;
  };

  // Function to find parent node and index
  const findParentNodeAndIndex = (nodes, key) => {
    if (key.indexOf('-') === -1) {
      // Root level node
      const index = nodes.findIndex(node => node.key === key);
      return { parent: null, index, parentList: nodes };
    }
    
    const parentKey = key.substring(0, key.lastIndexOf('-'));
    const parentNode = parentKey ? findNodeByKey(nodes, parentKey) : null;
    const parentList = parentNode ? parentNode.children : nodes;
    const index = parentList.findIndex(node => node.key === key);
    
    return { parent: parentNode, index, parentList };
  };

  // Handle drag and drop
  const onDragDrop = (event) => {
    try {
      const dragNodeKey = event.dragNode.key;
      const dropNodeKey = event.dropNode.key;
      
      // Create deep copies to avoid mutation issues
      const nodesCopy = deepCopy(nodes);
      
      // Find the drag node and its parent
      const dragNodeInfo = findParentNodeAndIndex(nodesCopy, dragNodeKey);
      if (dragNodeInfo.index === -1) {
        console.error("Drag node not found:", dragNodeKey);
        return;
      }
      
      // Get the actual drag node and remove it from its parent
      const dragNode = dragNodeInfo.parentList[dragNodeInfo.index];
      dragNodeInfo.parentList.splice(dragNodeInfo.index, 1);
      
      // Find the drop node
      const dropNode = findNodeByKey(nodesCopy, dropNodeKey);
      if (!dropNode) {
        console.error("Drop node not found:", dropNodeKey);
        return;
      }
      
      // If dropping on a folder (droppable node), add it as a child
      if (dropNode.droppable) {
        dropNode.children = dropNode.children || [];
        dropNode.children.push(dragNode);
      } else {
        // If dropping on a file, add it as a sibling
        const dropNodeInfo = findParentNodeAndIndex(nodesCopy, dropNodeKey);
        dropNodeInfo.parentList.splice(dropNodeInfo.index + 1, 0, dragNode);
      }
      
      // Update the state with the new tree structure
      setNodes(nodesCopy);
      toast.current.show({severity: 'success', summary: 'Éxito', detail: 'Elemento movido', life: 3000});
    } catch (error) {
      console.error("Error during drag and drop:", error);
      toast.current.show({severity: 'error', summary: 'Error', detail: 'No se pudo mover el elemento', life: 3000});
    }
  };
  
  // Generate next key based on parent key
  const generateNextKey = (parentKey) => {
    if (parentKey === null) {
      // Root level - find the next available key
      const existingKeys = nodes.map(node => parseInt(node.key, 10));
      const nextKey = Math.max(...existingKeys, -1) + 1;
      return nextKey.toString();
    }
    
    // Find the parent node
    const parentNode = findNodeByKey(nodes, parentKey);
    if (!parentNode) {
      console.error("Parent node not found:", parentKey);
      return null;
    }
    
    // If parent has no children yet, create first child
    if (!parentNode.children || parentNode.children.length === 0) {
      return `${parentKey}-0`;
    }
    
    // Otherwise, find the next available child key
    const childKeys = parentNode.children.map(child => {
      const lastPart = child.key.split('-').pop();
      return parseInt(lastPart, 10);
    });
    
    const nextChildIndex = Math.max(...childKeys) + 1;
    return `${parentKey}-${nextChildIndex}`;
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
        icon: 'pi pi-fw pi-folder',
        droppable: true,
        children: []
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
      
      setNodes(nodesCopy);
      setShowFolderDialog(false);
      toast.current.show({
        severity: 'success',
        summary: 'Éxito',
        detail: `Carpeta "${folderName}" creada`,
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
  
  // Delete node (folder or file)
  const deleteNode = (nodeKey) => {
    try {
      const nodesCopy = deepCopy(nodes);
      const nodeInfo = findParentNodeAndIndex(nodesCopy, nodeKey);
      
      if (nodeInfo.index === -1) {
        console.error("Node not found:", nodeKey);
        return;
      }
      
      // Get node before deletion
      const nodeToDelete = nodeInfo.parentList[nodeInfo.index];
      const nodeName = nodeToDelete.label;
      
      // Remove the node from its parent
      nodeInfo.parentList.splice(nodeInfo.index, 1);
      
      // Update the state with the new tree structure
      setNodes(nodesCopy);
      
      // If the deleted node was selected, clear selection
      if (selectedNodeKey && Object.keys(selectedNodeKey)[0] === nodeKey) {
        setSelectedNodeKey(null);
      }
      
      toast.current.show({
        severity: 'success',
        summary: 'Éxito',
        detail: `"${nodeName}" eliminado`,
        life: 3000
      });
    } catch (error) {
      console.error("Error deleting node:", error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo eliminar el elemento',
        life: 3000
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
    
    return (
      <div className="flex align-items-center gap-2" onContextMenu={(e) => onNodeContextMenu(e, node)}>
        <span className={options.icon}></span>
        <span className="node-label">{node.label}</span>
        <div className="ml-auto flex">
          {isFolder && (
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
          <SplitterPanel size={25} minSize={20} style={{ overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div className="p-2 flex justify-content-between align-items-center">
              <h3 className="m-0">Explorador</h3>
              <Button 
                icon="pi pi-plus" 
                rounded 
                size="small" 
                onClick={() => openNewFolderDialog(null)}
                tooltip="Crear carpeta raíz"
                tooltipOptions={{ position: 'top' }}
              />
            </div>
            <div style={{ height: '100%', overflow: 'auto', flex: 1 }}>
              <Tree 
                value={nodes} 
                selectionMode="single" 
                selectionKeys={selectedNodeKey} 
                onSelectionChange={e => setSelectedNodeKey(e.value)} 
                dragdropScope="files"
                onDragDrop={onDragDrop}
                className="w-full h-full sidebar-tree"
                nodeTemplate={nodeTemplate}
                filter
                filterMode="strict"
                filterPlaceholder="Buscar..."
              />
            </div>
          </SplitterPanel>
          
          {/* Main content area */}
          <SplitterPanel size={75} style={{ padding: '1rem', overflow: 'auto' }}>
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
    </div>
  );
};

export default App; 
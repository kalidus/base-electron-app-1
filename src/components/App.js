import React, { useState } from 'react';
import { Menubar } from 'primereact/menubar';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { Tree } from 'primereact/tree';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';

const App = () => {
  const toast = useRef(null);
  
  // Menu items for the top menubar
  const menuItems = [
    {
      label: 'Archivo',
      icon: 'pi pi-fw pi-file',
      items: [
        {
          label: 'Nuevo',
          icon: 'pi pi-fw pi-plus'
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

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Toast ref={toast} />
      
      {/* Top menubar */}
      <Menubar model={menuItems} />
      
      {/* Main content with splitter */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Splitter style={{ height: '100%' }}>
          {/* Left sidebar with tree */}
          <SplitterPanel size={20} minSize={10} style={{ overflow: 'auto' }}>
            <Tree 
              value={nodes} 
              selectionMode="single" 
              selectionKeys={selectedNodeKey} 
              onSelectionChange={e => setSelectedNodeKey(e.value)} 
              dragdropScope="files"
              onDragDrop={onDragDrop}
              className="w-full"
            />
          </SplitterPanel>
          
          {/* Main content area */}
          <SplitterPanel size={80} style={{ padding: '1rem', overflow: 'auto' }}>
            <Card title="Contenido Principal">
              <p className="m-0">
                Bienvenido a la aplicación de escritorio. Seleccione un archivo del panel lateral para ver su contenido.
              </p>
              {selectedNodeKey && (
                <div className="mt-3">
                  <p>Archivo seleccionado: {Object.keys(selectedNodeKey)[0]}</p>
                </div>
              )}
              <div className="mt-3">
                <p>Puedes arrastrar y soltar elementos en el panel lateral para reorganizarlos.</p>
              </div>
            </Card>
          </SplitterPanel>
        </Splitter>
      </div>
    </div>
  );
};

export default App; 
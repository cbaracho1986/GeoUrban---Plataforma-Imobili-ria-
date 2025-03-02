# GeoUrban-Plataforma Imobiliária 3D
## 📌 Objetivo
**plataforma ultra moderna** para modelagem 3D de planejamento urbano e arquitetônico, utilizando **Flask, HTML, CSS e JavaScript**, que permita aos usuários **visualizar, criar e manipular terrenos e edifícios** através de uma interface interativa 3D.

---

## 🎨 Características Principais

### **1. Interface e Experiência do Usuário (UX/UI)**
- **Design minimalista e responsivo**, utilizando **CSS moderno (Flexbox/Grid)**.
- **Renderização 3D fluida e otimizada** com WebGL via Three.js.
- **Painéis de controle intuitivos** para ajuste de parâmetros de construção.
- **Navegação 3D completa** com rotação, zoom e pan.

### **2. Visualização e Modelagem 3D**
- **Geração automática de edifícios** usando design generativo.
- **Ferramentas de desenho e edição de terrenos**:
  - Criar **terrenos retangulares** através de cliques e arrasto.
  - Ajuste de **parâmetros de construção** como densidade, uso e abertura.
- **Personalização de fachadas e estilos arquitetônicos**:
  - Estilos disponíveis: "Standard", "Grouped", "Grid" e "Chessboard".
  - Configuração de cores e detalhes de fachadas.

### **3. Funcionalidades Avançadas**
- **Edição de propriedades individuais dos edifícios**:
  - Altura de andares, inclinação de telhado, subespaços.
- **Geração de conjuntos de edifícios** com replicação linear.
- **Visualização de impacto urbano** no contexto existente.
- **Persistência de Dados**:
  - API REST para armazenamento de projetos.
  - Exportação de dados em JSON.

### **4. Tecnologias Implementadas**
- **Backend**: Flask (Python) para gerenciamento de API.
- **Frontend**:
  - **Three.js** para renderização 3D.
  - CSS personalizado para UI moderna.
  - JavaScript modular para lógica da aplicação.

---

## 🔄 Fluxo de Interação do Usuário
1. **Navegar no ambiente 3D** → Rotação, zoom e movimentação pela cena.
2. **Desenhar terrenos** → O usuário define áreas através de cliques e arrasto.
3. **Gerar edifícios** → Criação automática baseada em parâmetros definidos.
4. **Ajustar parâmetros** → Personalização de densidade, estilo e características.
5. **Visualizar o impacto** → Avaliação do projeto no contexto urbano.

---

## 📂 Estrutura do Código
- **Backend (Python/Flask)**:
  - `app.py` → Servidor Flask e endpoints da API.
  - `requirements.txt` → Dependências Python.
- **Frontend**:
  - `templates/index.html` → Estrutura principal da interface 3D.
  - `static/css/styles.css` → Estilização moderna e responsiva.
  - `static/js/main.js` → Lógica de visualização e edição 3D.
  - `static/models/` → Armazenamento de modelos 3D (quando aplicável).

---

## 💻 Como Executar o Projeto

1. Clone este repositório:
```bash
git clone <repository-url>
cd Plataforma_Imobiliaria_001
```

2. Crie um ambiente virtual (opcional, mas recomendado):
```bash
python -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate
```

3. Instale as dependências:
```bash
pip install -r requirements.txt
```

4. Execute a aplicação:
```bash
python app.py
```

5. Acesse a aplicação em `http://127.0.0.1:5000/`

---

## 🚀 Funcionalidades Implementadas
1. **Visualização 3D** com navegação completa.
2. **Desenho de terrenos** através de interações do mouse.
3. **Geração de edifícios procedurais** com parâmetros ajustáveis.
4. **Interface moderna e responsiva** com painéis de controle.
5. **API RESTful** para integração com sistemas externos.

---

## 🔮 Desenvolvimento Futuro
- Exportação para formatos 3D comuns (OBJ, GLTF)
- Modelagem avançada de terrenos
- Integração com dados GIS
- Recursos de colaboração
- Análise avançada de viabilidade urbana

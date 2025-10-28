Instruções para execução do Scope AI

1) Antes de começar (pré-requisitos)
•	Git instalado.
•	Node.js (v16+), npm
•	Editor (VS Code).
________________________________________
2) Obter o código
1.	git clone https://github.com/MateusZanchetaDev/ScopeAI.git
2.	cd ScopeAI
3.	Open folder (abrir o arquivo clonado do repositório)
________________________________________
3) Rodar o código localmente
Criar o arquivo .env
Esse é um arquivo de configuração que contém as chaves API de IA.
(OBS Segurança: Utilizamos a chave de conta de um participante de nosso grupo, portanto esta chave é um dado sensível e não deve ser utilizado em outro meio).
 
<img width="741" height="405" alt="image" src="https://github.com/user-attachments/assets/4cb0c364-cb3b-4b36-af6c-499c92f16566" />

<img width="606" height="124" alt="image" src="https://github.com/user-attachments/assets/ea09d24a-890c-4026-a929-19b31234fa0f" />

Colar o conteúdo abaixo no arquivo, e salvar.
 
<img width="886" height="265" alt="image" src="https://github.com/user-attachments/assets/7b42421f-be18-4cab-b52b-68f19b9a4740" />

==============================================================================================================================================================

VITE_SUPABASE_PROJECT_ID="mzmxqjgnbqbjhrlanvxv"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16bXhxamduYnFiamhybGFudnh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMzAzMzIsImV4cCI6MjA3NjgwNjMzMn0.9XwsxI2bzPxjEU26Vsk4rYUnLezfIX6OdbMexpvprBc"
VITE_SUPABASE_URL="https://mzmxqjgnbqbjhrlanvxv.supabase.co/"
GOOGLE_API_KEY="AIzaSyBC5w6vuQsn9MDe0GYPG7OhH_umG0oCZxw"
PORT=5001

==============================================================================================================================================================




Node
1.	Para executar o código é necessário ter o node_modules.

 <img width="458" height="198" alt="image" src="https://github.com/user-attachments/assets/2827806a-bb49-466d-b761-bb53c178f0be" />

É necessário executar no terminal o cmd: npm install
Após:

<img width="495" height="208" alt="image" src="https://github.com/user-attachments/assets/d3ebe409-3b76-47ef-a67e-d630439afa20" />

2.	Rodar o servidor local, executar no terminal o cmd: npm run dev

 <img width="802" height="289" alt="image" src="https://github.com/user-attachments/assets/fde13cef-1052-4d56-ab11-de1447637161" />


Backend
Para rodar o backend da aplicação.
1.	Abra um novo cmd no terminal 


<img width="520" height="255" alt="image" src="https://github.com/user-attachments/assets/f5d56008-aaeb-4a56-8b2e-03098c9b1997" />


2.	Execute o comando: node src\server.js


<img width="886" height="206" alt="image" src="https://github.com/user-attachments/assets/c221eb17-bb6e-4732-836a-d56a25075a5c" />


3.	Abra o link do localhost:


<img width="622" height="228" alt="image" src="https://github.com/user-attachments/assets/debb22c2-39a6-4a7d-963b-ec0f2ddfc49a" />


5) Como validar a solução?
1.	Smoke test: abrir frontend e confirmar página inicial carrega.
2.	Login/Registro: criar usuário, fazer login.


<img width="325" height="416" alt="image" src="https://github.com/user-attachments/assets/e75030ef-39da-4781-b20b-6ce7359fd738" />

3.	Funcionalidade principal: executar fluxo principal do produto (criar escopo, gerar transcrição, emitir relatório) e confirmar resultado esperado.
o	Vídeo em anexo.
o	Para o preenchimento do escopo, disponibilizamos um exemplo para preenchimento, que está em anexo.
o	Para gerar o compare, disponibilizamos um arquivo em .txt da transcrição da reunião, para realizar o upload na ferramenta e comparar o escopo com a transcrição.
________________________________________
7) Critérios de aceitação (o que significa “validado”)
•	Se o processamento da IA na comparação entre Escopo Reunião + Transcrição, foi realizada com sucesso, e conseguir gerar o resumo e o Score abordado.

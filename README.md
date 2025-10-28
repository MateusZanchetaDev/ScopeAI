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

Colar o conteúdo abaixo no arquivo, e salvar.

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
Ao final vamos colocar um exemplo de escopo e transcrição para realizar o upload na ferramenta e comparar o escopo com a transcrição.
[1-🗂️ Exemplo para preencher o escopo da reunião.txt](https://github.com/user-attachments/files/23198746/1-.Exemplo.para.preencher.o.escopo.da.reuniao.txt)
[Uploading 🎤 TRANSCRIÇÃO DA REUNIÃO.txt…]()
________________________________________
7) Critérios de aceitação (o que significa “validado”)
•	Se o processamento da IA na comparação entre Escopo Reunião + Transcrição, foi realizada com sucesso, e conseguir gerar o resumo e o Score abordado.

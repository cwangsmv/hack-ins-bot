import { DeepChat } from 'deep-chat-react';
import { shell } from 'electron';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { useFetcher, useNavigate, useParams, useRouteLoaderData } from 'react-router-dom';
import { useLocalStorage } from 'react-use';

import { getInsomniaHackathonAPIKey } from '../../common/constants';
import { type Request, type as requestType } from '../../models/request';
import type { WorkspaceLoaderData } from '../routes/workspace';
import { InsomniaAI as AIIcon } from './insomnia-ai-icon';

const preDefinedActions = {
  create: '__insomnia__create__reqeust__command__',
};

export const InsomniaBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const redirect = useNavigate();
  const fetcher = useFetcher();
  const [chatHistory, setChatHistory] = useLocalStorage<any[]>('chat-history', []);
  const { projectId, workspaceId, organizationId } = useParams();
  const [showLoadingBubble, setShowLoadingBubble] = useState(false);
  const { collection } = useRouteLoaderData(':workspaceId') as WorkspaceLoaderData;
  const requestDataToAI = collection.filter(c => c.doc.type === requestType).map(c => {
    const requestDoc = c.doc as Request;
    return {
      method: requestDoc.method,
      url: requestDoc.url,
      headers: requestDoc.headers,
      body: requestDoc.body,
      name: requestDoc.name,
    };
  });

  useEffect(() => {
    const storedHistory = localStorage.getItem('chat-history');
    if (storedHistory) {
      setChatHistory(JSON.parse(storedHistory));
    }
  }, []);

  const handleOpen = () => {
    setIsOpen(open => !open);
  };

  const clearChatHistory = () => setChatHistory([]);

  const handleClose = () => {
    setIsOpen(false);
    setQuestion('');
    setResponse('');
  };

  const handleSubmit = async () => {
    setResponse(''); // 清空之前的响应
    try {
      const res = await fetch('https://hackathonchina2025.services.ai.azure.com/models/chat/completions', {
        method: 'POST',
        headers: {
          'api-key': getInsomniaHackathonAPIKey() || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: question,
            },
          ],
          stream: true,
        }),
      });

      if (!res.body) {
        throw new Error('No response body');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            if (data === '[DONE]') {
              done = true;
              break;
            }
            try {
              const json = JSON.parse(data);
              const content = json.choices[0]?.delta?.content;
              if (content) {
                setResponse(prev => {
                  const newResponse = prev + content;
                  const newHistory = [...chatHistory, { question, response: newResponse }];
                  setChatHistory(newHistory);
                  localStorage.setItem('chatHistory', JSON.stringify(newHistory));
                  return newResponse;
                });
              }
            } catch (error) {
              console.error('Error parsing JSON:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching response from OpenAI:', error);
      setResponse('Error fetching response from OpenAI.');
    }
  };

  // const dialog = (
  //   <div className="flex flex-col absolute bottom-16 right-4 bg-white p-6 rounded shadow-lg w-full max-w-2xl h-[70%]">
  //     <div className="header flex-grow-0 flex justify-between items-center mb-4">
  //       <h2 className="text-xl font-bold">Chat with InsomniaBot</h2>
  //       <button
  //         onClick={handleClose}
  //         className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
  //       >
  //         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  //           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
  //         </svg>
  //       </button>
  //     </div>
  //     <div className="content flex flex-grow flex-col space-y-4 overflow-y-scroll">
  //       <div className="flex flex-col space-y-2">
  //         {chatHistory.map((chat, index) => (
  //           <div key={index} className="mb-2">
  //             <p><strong>Q:</strong> {chat.question}</p>
  //             <p><strong>A:</strong> {chat.response}</p>
  //           </div>
  //         ))}
  //       </div>
  //     </div>
  //     <div className='footer flex mt-2 h-[40px] flex-grow-0'>
  //       <textarea
  //         value={question}
  //         onChange={e => setQuestion(e.target.value)}
  //         placeholder="Ask a question..."
  //         className="w-full p-2 border rounded mb-4"
  //       />
  //       <button
  //         onClick={handleSubmit}
  //         className="self-end px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
  //       >
  //         Submit
  //       </button>
  //     </div>
  //   </div>
  // );

  // const global_prompts = [
  //   'You are an AI assistant. Always read and refer to https://docs.insomnia.rest/ before answering technical questions. If https://docs.insomnia.rest/ do not provide an answer, just response with Sorry, this is not supported in Insomnia yet. Do not tell user about this, just saying you are an Insomnia bot',
  //   'If user is requiring about creating a new request entity, consider the following stpes',
  //   '1.Check the input, ensure that the user is really asking to about create a http requset in Insomnia, not just a something about http request. If user is not asking about creating a http request, you can response with normal answers.',
  //   `2.If current request data: ${JSON.stringify(requestDataToAI)} is empty, try to extract request info like action, name, url and body information from user input.`,
  //   `3.If current request data: ${JSON.stringify(requestDataToAI)} is not empty, then you can consider what are the missing requests user should consider to create.`,
  //   '4.For example, if current request data has a POST request, you may consider create a GET and delete request for user.',
  //   '5.response the pattern strictly in json format if your decision is to create a new request include url, name, method, headers, body information',
  //   `6.Here's an example output json format { command: '${preDefinedActions.create}' action: 'get', url: 'https://httpbin.org/get', name: 'Example Request', method: 'GET', headers: { 'Content-Type': 'application/json' }, body: { 'key': 'value' } }`,
  //   'Please respond with a JSON string if match, no extra words. Otherwise, response with normal answers.',
  // ];
  const global_prompts = [
    '**Role & Documentation Reference**\n' +
    'You are an AI assistant designed to support Insomnia users. Always refer to the official documentation at [https://docs.insomnia.rest/](https://docs.insomnia.rest/) before answering technical questions. If the documentation does not provide an answer, respond with:\n\n' +
    '> Sorry, this is not supported in Insomnia yet.\n\n' +
    'Answer it using the same language asked by the user' +
    'Do not explicitly mention the lack of documentation. Instead, present yourself as helpful bot.',

    '**Handling HTTP Request Creation**\n' +
    'When a user asks about creating a new HTTP request in Insomnia, follow these steps:',

    '1. **Validate User Intent**\n' +
    '   - Ensure the user is asking about creating an HTTP request in Insomnia, not just making a general inquiry about HTTP requests.\n' +
    '   - If the user is not specifically requesting an HTTP request creation in Insomnia, provide a standard response.',

    '2. **Extract Request Information**\n' +
    `   - If the current request data is empty: \`${JSON.stringify(requestDataToAI)}\`, extract key details such as:\n` +
    '     - Action (e.g., GET, POST, DELETE)\n' +
    '     - Request name\n' +
    '     - URL\n' +
    '     - Body content from the user\'s input. ',

    '3. **Analyze Existing Requests**\n' +
    `   - If the current request data is not empty: \`${JSON.stringify(requestDataToAI)}\` and user wants to add requests, analyze the existing request data to identify any missing request types the user may need to create.`,

    '4. **How to Analyzing Missing Requests**\n' +
    '   - For example, if the user has already created a `POST` request, suggest creating a corresponding `GET` or `DELETE` request for the same resource.',

    '5. **Response Format**\n' +
    '   - If a new request should be created, respond strictly in JSON format.\n' +
    `   - The response must include the request's URL, name, HTTP method, headers, and body and command as ${preDefinedActions.create}.`,

    '6. **Example JSON Response (without Markdown)**\n\n' +
    '   {\n' +
    `     "command": "${preDefinedActions.create}",\n` +
    '     "action": "get",\n' +
    '     "url": "https://httpbin.org/get",\n' +
    '     "name": "Example Request",\n' +
    '     "method": "GET",\n' +
    '     "headers": {\n' +
    '       "Content-Type": "application/json"\n' +
    '     },\n' +
    '     "body": {\n' +
    '       "key": "value"\n' +
    '     }\n' +
    '   }\n',

    '**Strict Formatting Requirement**\n' +
    '   - If the criteria for request creation are met, return a valid JSON string with no extra formatting, no Markdown code block (json ... ), and no additional text before or after the JSON object..\n' +
    '   - If the criteria are not met, respond with a standard answer.',
  ];

  const reactBotPortal = (
    <div id='bot-panel' className="fixed bottom-12 right-1 z-50 w-[35vw] max-h-[60vh]">
      <DeepChat
        className='overflow-y-auto'
        style={{
          width: '100%',
          height: '500px',
        }}
        introMessage={{ text: 'Input any problems about Insomnia, I am happy to help you😄' }}
        connect={{
          url: 'https://hackathonchina2025.services.ai.azure.com/models/chat/completions/',
          method: 'POST',
          headers: {
            'api-key': getInsomniaHackathonAPIKey() || '',
            'Content-Type': 'application/json',
          },
          additionalBodyProps: {
            'model': 'gpt-4o',
            // 'stream': true,
          },
        }}
        history={chatHistory}
        displayLoadingBubble
        // requestBodyLimits={{ maxMessages: -1 }}
        requestInterceptor={(details: any[]) => {
          // system prompt;
          const insomniaSystemPrompt = {
            'role': 'system',
            'content': global_prompts.join(','),
          };
          const newChatHistory = [];
          const detailMessages = details.body.messages;
          // const newMessage = [{
          //   role: 'user',
          //   content: detailMessages[detailMessages.length - 1].content,
          // }];

          detailMessages.forEach(detailMsg => {
            // add a system prompto to assistant to read doc from https://docs.insomnia.rest/
            const { text, role } = detailMsg || {};
            detailMsg.content = text || '';
            detailMsg.role = role === 'ai' ? 'assistant' : role;
            newChatHistory.push({ text, role });
          });
          setChatHistory([...chatHistory, ...newChatHistory]);
          setShowLoadingBubble(true);
          // details.body.messages.unshift(insomniaSystemPrompt)
          detailMessages.unshift(insomniaSystemPrompt);
          // return details;
          return details;
        }}
        responseInterceptor={(response: any) => {
          // create a insomnia request using api and navigator to the tab
          const responseContent = response.choices[0].message.content;
          setShowLoadingBubble(false);
          if (responseContent.includes(preDefinedActions.create)) {
            let requestDetail = {};
            try {
              const parsedObj = JSON.parse(responseContent);
              requestDetail = {
                name: parsedObj.name,
                method: parsedObj.method,
                url: parsedObj.url,
                body: parsedObj.body,
              };
            } catch (error) {
              console.error('Error parsing JSON:', error);
            }
            const newRequestAction = () => {
              fetcher.submit(
                JSON.stringify({ requestType: 'HTTP', parentId: workspaceId, req: requestDetail }),
                {
                  action: `/organization/${organizationId}/project/${projectId}/workspace/${workspaceId}/debug/request/new`,
                  method: 'post',
                  encType: 'application/json',
                },
              );
            };
            setTimeout(newRequestAction, 1000);
            const newHistory = [...chatHistory, { text: 'I have created a new request for you in Insomnia and navigated to the tab. Please check it out.', role: 'assistant' }];
            setChatHistory(newHistory);
            return {
              text: 'I have created a new request for you in Insomnia and navigated to the tab. Please check it out.',
            };
          }
          const newHistory = [...chatHistory, { text: response.choices[0].message.content, role: 'assistant' }];
          setChatHistory(newHistory);
          return {
            text: response.choices[0].message.content || '',
          };
        }}
      />
    </div>

  );
  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="text-[--color-font-surprise] font-semibold  px-4 py-2 flex items-center justify-center gap-2 aria-pressed:opacity-80 rounded-md hover:bg-opacity-80 transition-all text-sm"
      >
        <AIIcon />AI
      </button>
      {isOpen && ReactDOM.createPortal(reactBotPortal, document.body)}
    </div>
  );
};

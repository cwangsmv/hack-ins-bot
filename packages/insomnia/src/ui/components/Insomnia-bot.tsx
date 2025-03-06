import { DeepChat } from 'deep-chat-react';
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useFetcher, useNavigate, useParams } from 'react-router-dom';
import { useLocalStorage } from 'react-use';

import { getInsomniaHackathonAPIKey } from '../../common/constants';

export const InsomniaBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const redirect = useNavigate();
  const fetcher = useFetcher();
  const [chatHistory, setChatHistory] = useLocalStorage([]);
  const { projectId, workspaceId, organizationId } = useParams();

  useEffect(() => {
    const storedHistory = localStorage.getItem('chatHistory');
    if (storedHistory) {
      setChatHistory(JSON.parse(storedHistory));
    }
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
  };

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

  const global_prompts = [
    'You are an AI assistant. Always read and refer to https://docs.insomnia.rest/ before answering technical questions. If https://docs.insomnia.rest/ do not provide an answer, just response with Sorry, this is not supported in Insomnia yet. Do not tell user about this, just saying you are an Insomnia bot',
    'If user input anything about create request, response with __insomnia__create__reqeust__command__',
  ];

  const reactBotPortal = (
    <div id='bot-panel' className="fixed bottom-0 right-0 z-50 w-full max-w-2xl">
      <DeepChat
        className='overflow-y-auto h-[60%] w-[30%]'
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
        requestBodyLimits={{ maxMessages: -1 }}
        requestInterceptor={(details: any[]) => {
          // system prompt;
          const insomniaSystemPrompt = {
            'role': 'system',
            'content': global_prompts.join(','),
          };
          console.log(details);
          details.body.messages.forEach(detailMsg => {
            // add a system prompto to assistant to read doc from https://docs.insomnia.rest/
            const { text, role } = detailMsg || {};
            detailMsg.content = text || '';
            detailMsg.role = role === 'ai' ? 'assistant' : role;
            const newChatHistory = [...chatHistory, { text, role: 'user' }];
            setChatHistory(newChatHistory);
          });
          details.body.messages.unshift(insomniaSystemPrompt);
          return details;
        }}
        responseInterceptor={(response: any) => {
          const newHistory = [...chatHistory, { text: response.choices[0].message.content, role: 'assistant' }];
          setChatHistory(newHistory);
          // create a insomnia request using api and navigator to the tab
          if (response.choices[0].message.content === '__insomnia__create__reqeust__command__') {
            const newRequestAction = () => {
              fetcher.submit(
                JSON.stringify({ requestType: 'HTTP', parentId: workspaceId }),
                {
                  action: `/organization/${organizationId}/project/${projectId}/workspace/${workspaceId}/debug/request/new`,
                  method: 'post',
                  encType: 'application/json',
                },
              );
            };
            setTimeout(newRequestAction, 1000);
            return {
              text: 'I have created a new request for you in Insomnia and navigated to the tab. Please check it out.',
            };
          }
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
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        InsomniaBot
      </button>
      {isOpen && ReactDOM.createPortal(reactBotPortal, document.body)}
    </div>
  );
};

import {
	faPaperPlane,
	faUser,
	faUserPlus,
	faImage,
	faDownload,
	faComment,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'Components/shared/Button';
import Input from 'Components/shared/Input';
import ChatGPTIcon from 'assets/images/chatGPT.png';
import {
	promptChatGPT,
	generateDalleImage,
	addImagePrice,
	getImagePriceUsage,
	addChatPrice,
	getChatPriceUsage,
} from 'modules/web';
import { Component, createRef } from 'react';
import MarkdownIt from 'markdown-it';
import mdKatex from 'markdown-it-katex';
import mdHighlight from 'markdown-it-highlightjs';
import hljs from 'highlight.js';
import _ from 'lodash';
import { Link } from 'react-router-dom';
import './ChatGPT.scss';
import 'highlight.js/styles/atom-one-dark.css';
import { downloadImage } from 'modules/utils';
import { getCookie } from 'modules/cookies';
import { getNTokens } from 'modules/utils';
import Toggle from 'Components/shared/Toggle';

class ChatGPT extends Component {
	constructor() {
		super();

		this.state = {
			history: [],
			message: '',
			imagePriceUsage: 0,
			chatPriceUsage: 0,
			loading: false,
		};

		this.historyRef = createRef();
		this.imageUsageBarUsedRef = createRef();
		this.chatUsageBarUsedRef = createRef();
	}

	async generateDalleImage() {
		const { message } = this.state;

		if (!message) {
			return;
		}

		if (this.state.imagePriceUsage >= 0.2) {
			return;
		}

		this.setState({
			loading: true,
			imagePriceUsage: this.state.imagePriceUsage + 0.02,
		});

		addImagePrice({
			email: getCookie('email'),
		});

		this.usageBarUsedRef.current.style.width = `${
			((this.state.imagePriceUsage + 0.02) / 0.2) * 100
		}%`;

		const imageArray = await generateDalleImage(message);

		const time = new Date().toLocaleTimeString();

		this.setState({
			history: [...this.state.history, [message, imageArray, time, true]],
			loading: false,
			needscroll: true,
		});
	}

	async promptChatGPT() {
		const { history, message } = this.state;

		if (!message) {
			return;
		}

		this.setState({
			loading: true,
		});

		let response = await promptChatGPT(
			history
				.filter((message) => message.length !== 4)
				.map((message) => [message[0], message[1]]),
			message
		);

		if (!response) {
			const completion =
				'Whoops! Something went wrong. Please try again.';
			response = {
				completion,
				history: [
					...history
						.filter((message) => message.length !== 4)
						.map((message) => [message[0], message[1]]),
					[message, completion],
				],
			};
		}

		let { completion, history: newHistory } = response;

		const time = new Date().toLocaleTimeString();
		const price = (getNTokens(completion) / 1000) * 0.002;

		addChatPrice({
			email: getCookie('email'),
			price,
		});

		this.setState({
			history: [...history, [...newHistory[newHistory.length - 1], time]],
			loading: false,
			needscroll: true,
		});
	}

	async componentDidUpdate() {
		const history = this.historyRef.current;

		if (
			!history ||
			!this.imageUsageBarUsedRef.current ||
			!this.chatUsageBarUsedRef.current
		)
			return;

		if (this.state.needscroll) {
			history.scrollTop = history.scrollHeight;

			this.setState({
				needscroll: false,
			});
		}

		// set ignoreUnescapedHTML to true
		hljs.configure({ ignoreUnescapedHTML: true });
		hljs.highlightAll();

		const imagePriceUsage = await getImagePriceUsage({
			email: getCookie('email'),
		});

		const chatPriceUsage = await getChatPriceUsage({
			email: getCookie('email'),
		});

		this.setState({
			imagePriceUsage,
			chatPriceUsage,
		});

		this.imageUsageBarUsedRef.current.style.width = `${
			(imagePriceUsage / 0.2) * 100
		}%`;

		this.chatUsageBarUsedRef.current.style.width = `${
			(chatPriceUsage / 0.2) * 100
		}%`;
	}

	render() {
		return (
			this.props.loaded &&
			(this.props.loggedIn ? (
				<div className='chatgpt'>
					<div className='history' ref={this.historyRef}>
						{this.state.history.length === 0 && (
							<div className='history-message history-message-bot'>
								<span>
									Welcome to ChatGPT! Type a message to get
									started.
								</span>
							</div>
						)}
						{this.state.history.map((message, index) => {
							const md = MarkdownIt({
								linkify: true,
								breaks: true,
							})
								.use(mdKatex)
								.use(mdHighlight);
							const isDalleGeneration = message.length === 4;

							let rendered;

							if (!isDalleGeneration) {
								let messageData = message[1];

								rendered = md.render(messageData);
							}

							return (
								<div key={index}>
									{index === this.state.history.length - 1 &&
										this.state.history.length > 1 && (
											<div className='newest-message-line'>
												<div className='newest-message-line-label'>
													New
												</div>
											</div>
										)}
									{!isDalleGeneration ? (
										<>
											<div className='history-message'>
												<FontAwesomeIcon
													className='message-icon user-icon'
													icon={faUser}
												/>
												<div className='message-content'>
													<div className='message-time'>
														{message[2]}
													</div>
													{message[0]}
												</div>
											</div>
											<div className='history-message history-message-bot'>
												<img
													src={ChatGPTIcon}
													className='message-icon'
													alt='ChatGPT'
												/>
												<div className='message-content'>
													<div className='message-time'>
														{message[2]}
													</div>
													<div
														className='chatgpt-completion'
														dangerouslySetInnerHTML={{
															__html: rendered,
														}}
													/>
												</div>
											</div>
										</>
									) : (
										<>
											<div className='history-message'>
												<FontAwesomeIcon
													className='message-icon user-icon'
													icon={faUser}
												/>
												<div className='message-content'>
													<div className='message-time'>
														{message[2]}
													</div>
													{message[0]}
												</div>
											</div>
											<div className='history-message history-message-bot'>
												<img
													src={ChatGPTIcon}
													className='message-icon'
													alt='ChatGPT'
												/>
												<div className='message-content'>
													<div className='message-time'>
														{message[2]}
													</div>
													<img
														src={message[1]}
														alt='Dalle Generation'
														className='dalle-generation'
													/>
													<Button
														label='Download'
														icon={faDownload}
														onClick={() =>
															downloadImage(
																message[1]
															)
														}
													/>
												</div>
											</div>
										</>
									)}
								</div>
							);
						})}
						{this.state.loading && (
							<div className='history-message history-message-bot'>
								<img
									src={ChatGPTIcon}
									className='message-icon'
									alt='ChatGPT'
								/>
								<div className='message-content'>
									<div className='message-time'>
										{new Date().toLocaleTimeString()}
									</div>

									<div className='chatgpt-completion'>
										<span>Thinking...</span>
									</div>
								</div>
							</div>
						)}
					</div>
					<div className='chatgpt-controls'>
						<div className='chatgpt-input'>
							<Input
								label='Message'
								placeholder='Type a message...'
								value={this.state.message}
								onChange={(message = '') =>
									this.setState({ message })
								}
							/>
							<Button
								icon={faPaperPlane}
								big
								cta
								onClick={() => {
									this.promptChatGPT();
									this.setState({ message: '' });
								}}
								label='Send'
							/>
							<Button
								icon={faImage}
								big
								onClick={() => {
									this.generateDalleImage();
									this.setState({ message: '' });
								}}
								label='Generate Image'
							/>
						</div>
						<div className='usage'>
							<span className='usage-label'>
								Images Used Up (
								{Math.floor(
									(0.2 - this.state.imagePriceUsage) / 0.02
								)}{' '}
								Images Left):{' '}
							</span>
							<div className='usage-bar'>
								<div
									className='usage-bar-used'
									ref={this.imageUsageBarUsedRef}
								/>
							</div>
						</div>
						<div className='usage'>
							<span className='usage-label'>
								Chat Tokens Used Up (About{' '}
								{Math.floor(
									(0.2 - this.state.chatPriceUsage) / 0.002
								)}
								k Chat Tokens Left):{' '}
							</span>
							<div className='usage-bar'>
								<div
									className='usage-bar-used'
									ref={this.chatUsageBarUsedRef}
								/>
							</div>
						</div>
					</div>
				</div>
			) : (
				<div className='chatgpt'>
					<div className='history' ref={this.historyRef}>
						<div className='history-message history-message-bot'>
							<span>
								Welcome to ChatGPT!{' '}
								<Link to='/login' className='link'>
									{' '}
									Login
								</Link>{' '}
								or{' '}
								<Link to='/signUp' className='link'>
									Sign Up
								</Link>{' '}
								to TamGames to get started.
							</span>
						</div>
						<div className='history-message buttons-message'>
							<Link to='/login'>
								<Button icon={faUser} cta label='Login' />
							</Link>
							<Link to='/signUp'>
								<Button icon={faUserPlus} label='Sign Up' />
							</Link>
						</div>
					</div>
					<div className='chatgpt-input'>
						<Input
							label='Message'
							placeholder='Type a message...'
							disabled
						/>
						<Button icon={faPaperPlane} big disabled label='Send' />
					</div>
				</div>
			))
		);
	}
}

export default ChatGPT;

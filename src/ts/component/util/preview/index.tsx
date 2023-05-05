import * as React from 'react';
import $ from 'jquery';
import raf from 'raf';
import { observer } from 'mobx-react';
import { PreviewLink, PreviewObject } from 'Component';
import { I, Util, ObjectUtil, Preview, Mark, translate, Renderer } from 'Lib';
import { commonStore, menuStore } from 'Store';

interface State {
	object: any;
};

const OFFSET_Y = 8;
const BORDER = 12;

const PreviewComponent = observer(class PreviewComponent extends React.Component<object, State> {
	
	state = {
		object: null,
	};
	ref: any = null;
	
	constructor (props: any) {
		super(props);

		this.onClick = this.onClick.bind(this);
		this.onCopy = this.onCopy.bind(this);
		this.onEdit = this.onEdit.bind(this);
		this.onUnlink = this.onUnlink.bind(this);
		this.position = this.position.bind(this);
		this.setObject = this.setObject.bind(this);
	};
	
	render () {
		const { preview } = commonStore;
		const { type, param, noUnlink } = preview;
		const cn = [ 'preview' ];

		let head = null;
		let content = null;

		switch (type) {
			case I.MarkType.Link:
				head = (
					<div className="head">
						<div id="button-copy" className="item" onClick={this.onCopy}>{translate('previewCopy')}</div>
						<div id="button-edit" className="item" onClick={this.onEdit}>{translate('previewEdit')}</div>
						{!noUnlink ? <div id="button-unlink" className="item" onClick={this.onUnlink}>{translate('previewUnlink')}</div> : ''}
					</div>
				);

				content = <PreviewLink ref={(ref: any) => { this.ref = ref; }} url={param} position={this.position} />;
				break;

			case I.MarkType.Object:
				if (!noUnlink) {
					head = (
						<div className="head">
							<div id="button-unlink" className="item" onClick={this.onUnlink}>{translate('previewUnlink')}</div>
						</div>
					);
				};

				content = <PreviewObject ref={(ref: any) => { this.ref = ref; }} rootId={param} setObject={this.setObject} position={this.position} />;
				break;
		};

		if (head) {
			cn.push('withHead');
		};

		return (
			<div id="preview" className={cn.join(' ')}>
				<div className="polygon" onClick={this.onClick} />
				<div className="content">
					{head}

					<div className="cp" onClick={this.onClick}>
						{content}
					</div>
				</div>
			</div>
		);
	};
	
	onClick (e: any) {
		const { preview } = commonStore;
		const { type, param } = preview;
		const { object } = this.state;

		switch (type) {
			case I.MarkType.Link:
				Renderer.send('urlOpen', param);	
				break;

			case I.MarkType.Object:
				ObjectUtil.openEvent(e, object);
				break;
		};
	};
	
	onCopy () {
		const { preview } = commonStore;
		const { param } = preview;
		
		Util.clipboardCopy({ text: param });
		Preview.previewHide(true);
	};
	
	onEdit (e: any) {
		e.preventDefault();
		e.stopPropagation();

		const { preview } = commonStore;
		const { marks, range, onChange } = preview;
		const mark = Mark.getInRange(marks, I.MarkType.Link, { from: range.from, to: range.to });
		const win = $(window);
		const rect = Util.objectCopy($('#preview').get(0).getBoundingClientRect());

		menuStore.open('blockLink', {
			rect: rect ? { ...rect, height: 0, y: rect.y + win.scrollTop() } : null, 
			horizontal: I.MenuDirection.Center,
			onOpen: () => { Preview.previewHide(true); },
			data: {
				filter: mark ? mark.param : '',
				type: mark ? mark.type : null,
				onChange: (newType: I.MarkType, param: string) => {
					onChange(Mark.toggleLink({ type: newType, param: param, range: range }, marks));
				}
			}
		});
	};
	
	onUnlink () {
		const { preview } = commonStore;
		const { type, range, onChange } = preview;
		
		onChange(Mark.toggleLink({ type: type, param: '', range: range }, preview.marks));
		Preview.previewHide(true);
	};

	setObject (object: any) {
		this.setState({ object });
	};

	position () {
		const { preview } = commonStore;
		const { element } = preview;
		
		if (!element || !element.length) {
			return;
		};

		const win = $(window);
		const obj = $('#preview');
		const poly = obj.find('.polygon');
		const ww = win.width();
		const wh = win.height();
		const st = win.scrollTop();
		const offset = element.offset();
		const nw = element.outerWidth();
		const nh = element.outerHeight();
		const ow = obj.outerWidth();
		const oh = obj.outerHeight();
		const css: any = { opacity: 0, left: 0, top: 0 };
		const pcss: any = { top: 'auto', bottom: 'auto', width: '', left: '', height: nh + OFFSET_Y, clipPath: '' };

		let typeY = I.MenuDirection.Bottom;		
		let ps = (1 - nw / ow) / 2 * 100;
		let pe = ps + nw / ow * 100;
		let cpTop = 'polygon(0% 0%, ' + ps + '% 100%, ' + pe + '% 100%, 100% 0%)';
		let cpBot = 'polygon(0% 100%, ' + ps + '% 0%, ' + pe + '% 0%, 100% 100%)';
		
		if (ow < nw) {
			pcss.width = nw;
			pcss.left = (ow - nw) / 2;
			ps = (nw - ow) / nw / 2 * 100;
			pe = (1 - (nw - ow) / nw / 2) * 100;
			
			cpTop = 'polygon(0% 100%, ' + ps + '% 0%, ' + pe + '% 0%, 100% 100%)';
			cpBot = 'polygon(0% 0%, ' + ps + '% 100%, ' + pe + '% 100%, 100% 0%)';
		};

		if (offset.top + oh + nh >= st + wh) {
			typeY = I.MenuDirection.Top;
		};
		
		if (typeY == I.MenuDirection.Top) {
			css.top = offset.top - oh - OFFSET_Y;
				
			pcss.bottom = -nh - OFFSET_Y;
			pcss.clipPath = cpTop;
		};
			
		if (typeY == I.MenuDirection.Bottom) {
			css.top = offset.top + nh + OFFSET_Y;
				
			pcss.top = -nh - OFFSET_Y;
			pcss.clipPath = cpBot;
		};
			
		css.left = offset.left - ow / 2 + nw / 2;
		css.left = Math.max(BORDER, css.left);
		css.left = Math.min(ww - ow - BORDER, css.left);

		obj.show().css(css);
		poly.css(pcss);
		
		raf(() => { 
			obj.css({ opacity: 1 });
		});
	};

});

export default PreviewComponent;
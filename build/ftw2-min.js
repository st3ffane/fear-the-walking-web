!function(a,b){"function"==typeof define&&define.amd?define([],function(){return b()}):"object"==typeof module&&module.exports?module.exports=b():b()}(0,function(){function __define_property(a,b){Object.defineProperty(a,b,{get:function(){return this["__"+b]},set:function(a){var c=this["__"+b];if(null!=a&&defineBindObject(a),null!=c&&c.RemoveFromOwners&&c.RemoveFromOwners(this,b),null!=a&&a.AddToOwners&&a.AddToOwners(this,b),this["__"+b]=a,this.__uuid__){var d=this.__uuid__+":"+b,e=BINDINGS;d in e&&__notifyDatasetChanged(this,e[d],d)}}})}function __prop_binding(a){null!=a&&(this._path=a.path,this.to=a.to,this.from=a.from,this.mode=a.mode,this.converter=a.converter,this._converter_params=null,this._fallback=null,this.converter_params=a.converter_params,this.fallback=a.fallback,this.alt=a.alt,this.root=a.root,this._element=a._element,this._key_uuid_=null)}function __textContent_binding(a){__prop_binding.call(this,a),this._index=a._index,this._length=a._length}function __attr_binding(a){__prop_binding.call(this,a),this._index=a._index,this._length=a._length}function __model_binding(a){null!=a&&(this.deep=a.deep||!0,__prop_binding.call(this,a),this.presenter=a.presenter,this.merge=a.merge,this.empty=a.empty,this._empty=!1,this._child_binding=[],this._generated_keys=[],this._ftw2_type=null)}function __command_binding(a){__prop_binding.call(this,a);var b=this;this.__process_event=function(a){if(null!=b.context){var c=b.command;null==c&&(c=b.fallback),c=b.convert_value(c,b.context);var d=null;if(null!=b.command_params)for(d=[],cpi=0;cpi<b.command_params.length;cpi++)if("$"==b.command_params[cpi][0]){var e=b.command_params[cpi].substr(1);"this"==e&&d.push(b.context),e in b.context?d.push(b.context[e]):d.push("null")}else d.push(b.command_params[cpi]);CONTEXT[c](a,d)}},a.from=this.from="COMMANDS",this.context=null,this.command=a.command,this._cmd_parameters=null,this.command_params=a.command_params}function __input_binding(a){__prop_binding.call(this,a);var b=this;this.on_process_event=function(a){if(null!=b.context){var c=b.return_value===!0?this.value:this[b.to];null!=c&&void 0!=c&&""!=c||(this.placeholder=b.fallback);try{b.mirror(c),this.setCustomValidity("")}catch(a){if(this.setCustomValidity(a.message),this.form)if(this.form.reportValidity)window.setTimeout(function(){b._element.form.reportValidity();var a=b.convert_value(b.context[b.from],b.context);if(null===a||void 0===a||""===a)return void _dom_batch_.dom_batch_set_property(b._element,"placeholder",b.fallback);_dom_batch_.dom_batch_set_property(b._element,b.to,a),window.setTimeout(function(){b._element.setCustomValidity("")},2e3)});else for(form=b._element.form,i=form.length-1;i>=0;i--){var d=form[i];if("submit"==d.getAttribute("type"))return void window.setTimeout(function(){if(d.click(),null===(c=b.convert_value(b.context[b.from],b.context))||void 0===c||""===c)return _dom_batch_.dom_batch_set_property(b._element,"placeholder",b.fallback),void _dom_batch_.dom_batch_set_property(b._element,"value","");_dom_batch_.dom_batch_set_property(b._element,b.to,c),window.setTimeout(function(){b._element.setCustomValidity("")},2e3)},20)}}}},this._pass=!1,this.return_value=a.return_value,this._event=null==a.event?"change":a.event,a.process_event&&this.init(CONTEXT)}function __webservice_parameter(a,b){this.name=a,this.value=b,this.important=!0,b.startsWith("$")?this.value=b.substr(1):(this.value=b.substr(2),this.important=!1)}function __webservice_url(a){this._url=a,this._params=[],this._param_str="";var b=a.indexOf("?");if(b!=-1&&(this._url=a.substr(0,b),param_str=a.substr(b+1),match=__webservice_param_regex.exec(param_str),match)){for(params=[],pi=0;match;)str=match[0],name=match[1],value=match[2],this._params.push(new __webservice_parameter(name,value)),param_str=param_str.replace(str,"{"+pi+"}"),pi++,__webservice_param_regex.lastIndex=0,match=__webservice_param_regex.exec(param_str);this._param_str=param_str}}function WEBSERVICE_LOADING(a){this.message=a}function WEBSERVICE_ERROR(a){this.message=""+a}function WEBSERVICE_TIMEOUT(a){this.message=""+a}function __load_async_datas(a,b,c,d){var e=new XMLHttpRequest;b[c]=new WEBSERVICE_LOADING,b.notifyDatasetChanged(d,1),e.onload=function(a){if(200!==e.status)return b[c]=new WEBSERVICE_ERROR(e.responseText),void b.notifyDatasetChanged(d,1);if(datas=e.response,null==datas)return b[c]=null,void b.notifyDatasetChanged(d,1);if(type=e.getResponseHeader("content-type"),type.startsWith("application/json"))try{datas=JSON.parse(datas)}catch(a){datas=new WEBSERVICE_ERROR("Erreur lors du parse JSON")}else this.reader&&(datas=window[this.reader](datas));b[c]=datas,b.notifyDatasetChanged(d,1)},e.onerror=function(a){b[c]=new WEBSERVICE_ERROR(a),b.notifyDatasetChanged(d,1)},e.timeout=xhr_timeout,e.ontimeout=function(a){b[c]=new WEBSERVICE_TIMEOUT(a),b.notifyDatasetChanged(d,1)},e.open("GET",a),e.send()}function __webservice_model_binding(a){if(__model_binding.call(this,a),this.reader=a.reader,1==this.from.startsWith("http://")||1==this.from.startsWith("https://")){this._url=new __webservice_url(this.from),this.from=a.as||generateUUID(),this._prop_name="_"+this.from;var b=this._url.getParametersNames();b&&(void 0==this.alt?this.alt=b:this.alt+=","+b)}}function generateUUID(){return __uuid_date=(new Date).getTime(),"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,__replace_uuid)}function __replace_uuid(a){var b=__uuid_date,c=(b+16*Math.random())%16|0;return b=Math.floor(b/16),("x"==a?c:3&c|8).toString(16)}function getDomPath(a,b){var c=a;if(c){for(var d=[];c!=b&&null!=c.parentNode;){if(c.hasAttribute("id")&&""!=c.id)d.unshift(c.nodeName.toLowerCase()+"#"+c.id);else{for(var e=0,f=0,g=c.nodeName,h=c.parentNode.childNodes.length,i=c.parentNode.childNodes,j=0;j<h;j++){var k=i[j];if(k.nodeName==g){if(k===c){f=e;break}e++}}f>0?d.unshift(g+":nth-of-type("+(f+1)+")"):d.unshift(g)}c=c.parentNode}return d.join(" > ")}}function check_radio_value(a,b){return a?a==b:null}function is_true(a,b){var c=1==a;return b&&b.length>=2&&(c=c?b[1]:b[0]),c}function ftw2_getLocale(){return void 0!=navigator.languages?navigator.languages[0]:navigator.language}function localize_number(a,b){return null==a?"":(after=2,locale=ftw2_getLocale(),b&&(after=b[0]||2,locale=b[1]||locale),a.toLocaleString("fr-FR",{maximumFractionDigits:after,minimumFractionDigits:after}))}function __unstringify(a){return null!=a&&"'"==a[0]&&"'"==a[a.length-1]&&(a=a.substring(1,a.length-1)),a}function removeChildAndClearEvents(a,b){a.removeChild(b)}function clear_events(a){if(a.eventListenerList){var b=null,c=0;for(key in a.eventListenerList)for(b=a.eventListenerList[key],c=b.length;c--;)a.removeEventListener(key,b[c]),a._input_binding&&(a._input_binding=null),a._cmd_binding&&(a._cmd_binding=null)}if(a.children)for(var d=null,e=a.children.length;e--;)d=a.children[e],clear_events(d)}function dom_batch_command(arguments){this._next=null,this._params=arguments}function batch_optain(){var a=null;return BATCH_RECYCLE.length>0?(a=BATCH_RECYCLE.pop(),a._params=arguments):a=new dom_batch_command(arguments),a}function batch_recycle(a){a._next=null,a._params=null,BATCH_RECYCLE.push(a)}function dom_batch(){this.dom_batch_budget=10,this.raf_called=!1,this.infos=function(){return"INFOS: called:"+this.raf_called},this.performance=window.performance||{},this.performance.now=performance.now||performance.mozNow||performance.msNow||performance.oNow||performance.webkitNow||Date.now,this._commands=null,this._last=null,this.append_command=function(a){null!=this._last?this._last._next=a:this._commands=a,this._last=a},this.dom_batch_removeChild=function(a,b){var c=batch_optain(BATCH_REMOVE,a,b);this.append_command(c),this.update_dom()},this.dom_batch_append_child=function(a,b){var c=batch_optain(BATCH_APPEND,a,b);this.append_command(c),this.update_dom()},this.dom_batch_insertBefore=function(a,b,c){var d=batch_optain(BATCH_INSERT_BEFORE,a,b,c);this.append_command(d),this.update_dom()},this.dom_batch_set_attribute=function(a,b,c){var d=batch_optain(BATCH_SET_ATTRIBUTE,a,b,c);this.append_command(d),this.update_dom()},this.dom_batch_set_property=function(a,b,c){var d=batch_optain(BATCH_SET_PROPERTY,a,b,c);this.append_command(d),this.update_dom()},this.update_dom=function(a){this.raf_called&&!a||(this.raf_called=!0,r_a_f(dom_batch_update_dom))}}function dom_batch_update_dom(a){var b=_dom_batch_,c=b._commands;if(c){for(var d=b.performance.now(),e=b.dom_batch_budget;e>0&&null!=c;){var f=c._params,g=c;c=c._next,batch_recycle(g);switch(f[0]){case 0:f[1].appendChild(f[2]);break;case 1:f[1].removeChild(f[2]);break;case 2:f[1].insertBefore(f[2],f[3]);break;case 3:f[1].setAttribute(f[2],f[3]);break;case 4:f[1][f[2]]=f[3]}e-=_dom_batch_.performance.now()-d}b._commands=c,null!=c?_dom_batch_.update_dom(!0):(b._last=null,b._commands=null,_dom_batch_.raf_called=!1)}}function notifyDatasetChanged(a,b){if(null==a||""==a){var c=null,d=null,e=null;for(a in BINDINGS){for(c=a.split(":")[1],d=[],i=0;i<BINDINGS[a].length;i++)e=BINDINGS[a][i],"COMMANDS"!=e.from&&e.from!=c||d.push(e);__notifyDatasetChanged(CONTEXT,d,a)}}else CONTEXT.process_update=!0,a in BINDINGS&&__notifyDatasetChanged(CONTEXT,BINDINGS[a],a,b),CONTEXT.process_update=!1}function __notifyDatasetChanged(a,b,c,d){var e=0,f=null,g=null;for(var h in b)e=null,f=b[h],"$this"==c||"$this"==f.from?e=a:(g=f.from,null!=a&&g in a&&(e=a[g])),f.populate(e,a,d)}function __get_bindings(a,b,c){for(var d=c||".//*[contains(text(),'{binding ') or @*[contains(.,'{binding ')]]",e=document.evaluate(d,a,null,XPathResult.ORDERED_NODE_ITERATOR_TYPE,null),f=e.iterateNext(),g=[],h=null;null!=f;)h=__get_binding_from_attributes(f,a,b),null!=h&&0!=h.length?(__prepare_binding(h,b,g),f=e.iterateNext()):f=e.iterateNext();return h=__get_binding_from_attributes(a,a,b),null!=h&&h.length>0&&__prepare_binding(h,b,g),g}function __prepare_binding(a,b,c){for(var d=a.length,e=null,f=null;d--;)if(binding=a[d],null!=(e=null==binding.from?binding.command:binding.from))if(b){f=binding.getBindingKeys();for(var g=f.length;g--;){var h=f[g];h=CONTEXT.__uuid__+":"+h,h in c?c[h].push(binding):c[h]=[binding]}}else e in c?c[e].push(binding):c[e]=[binding]}function __get_binding_from_attributes(a,b,c){for(var d=[],e=a.attributes,f=e.length;f--;){attr=a.attributes[f];var g=__parse_attribute(a,b,attr.nodeName,attr.value,c);null!=g&&d.push(g)}for(var h=a.childNodes,i="",j=0;j<h.length;j++)3==h[j].nodeType&&(i+=h[j].textContent);if(i.trim(),""!=i){var g=__parse_attribute(a,b,"innerHTML",i,c);null!=g&&d.push(g)}return d}function __parse_attribute(a,b,c,d,e){var f=d;if(null==f||""==f)return null;var g=__verif_regex__.exec(f);if(null==g)return null;f=g[1];var h=[];h.root=b,h.path=getDomPath(a,b);var i=c;0==i.indexOf("data-binded-")&&(i=i.split("-")[2]),h.to=i;var j=__verif_regex__.lastIndex-f.length;h._index=j,h._length=f.length;for(var k=__regex__.exec(f);null!=k;)h[k[1]]=k[2],k=__regex__.exec(f);if(__regex__.lastIndex=0,__verif_regex__.lastIndex=0,null==h.from&&null==h.command)return null;h.process_event=e;var l=h;return e&&(h._element=a,l=__create_binding_from_infos(h),l.init(CONTEXT)),l}function __create_binding_from_infos(a){return null!=a.presenter?(a.to="innerHTML",1==a.from.startsWith("http://")||1==a.from.startsWith("https://")?new __webservice_model_binding(a):new __model_binding(a)):null!=a.command?new __command_binding(a):"2way"==a.mode?("input"==a._element.localName&&("radio"==a._element.getAttribute("type")&&"checked"==a.to?(a.return_value=!0,void 0==a.event&&(a.event="click"),void 0==a.converter&&(a.converter="ftw2:check_radio_value",a.converter_params="'"+a._element.value+"'")):"text"==a._element.getAttribute("type")&&null!=a._element.getAttribute("list")&&(a.event="input")),new __input_binding(a)):"innerHTML"==a.to?new __textContent_binding(a):null==a.forceAttr&&a.to in a._element?new __prop_binding(a):new __attr_binding(a)}function AppInit(){if(ctx=document.body.getAttribute("data-context"),null==ctx)throw"No context defined!";if(ctx=window[ctx],ctx instanceof Function?CONTEXT=new ctx:(CONTEXT=ctx,ctx=CONTEXT.constructor),null==CONTEXT)throw"No context defined!";defineBindObject(CONTEXT),CONTEXT.__process_update=!1,ctx.defineBindProperty("process_update",{get:function(){return this.__process_update},set:function(a){this.__process_update!=a&&(this.__process_update=a,key=this.__uuid__+":process_update",key in BINDINGS&&__notifyDatasetChanged(this,BINDINGS[key],key))},enumerable:!1}),CONTEXT.__end_init=!1,ctx.defineBindProperty("end_init",{get:function(){return this.__end_init},set:function(a){this.__end_init!=a&&(this.__end_init=a,key=this.__uuid__+":end_init",key in BINDINGS&&__notifyDatasetChanged(this,BINDINGS[key],key))},enumerable:!1});var a=document.querySelector("body>div[data-role='presenters']");if(null!=a)for(a.style.display="none",models=a.querySelectorAll("body>div[data-role=presenters]>[data-role=presenter]"),moi=0;moi<models.length;moi++){var b=models[moi];if(id=b.getAttribute("id"),null!=id&&(null!=b.children||null!=b.childNodes)){if(children=b.children,null==children){children=[],end=b.childNodes.length,current=0,cn=b.childNodes;do{node=cn[current],8==node.nodeType||3==node.nodeType&&!/\S/.test(node.nodeValue)||children.push(node),current++}while(current<end)}if(1==children.length)MODELS[id]={bindings:__get_bindings(children[0],!1),template:children[0],recycle:[]};else for(c_i=0;c_i<children.length;c_i++)mdl=children[c_i],dtype=mdl.getAttribute("data-type"),null==dtype?MODELS[id]={bindings:__get_bindings(mdl,!1),template:mdl,recycle:[]}:MODELS[id+"_"+dtype]={bindings:__get_bindings(mdl,!1),template:mdl,recycle:[]}}}BINDINGS=__get_bindings(document.body,!0,"//*[not(ancestor::div[@data-role='presenters']) and (@*[contains(.,'{binding ')] or contains(text(),'{binding ')) ]"),notifyDatasetChanged(),CONTEXT.end_init=!0}Function.prototype.defineBindProperty=function(a,b){b.set?(setters={get:function(){return b.get.call(this)},set:function(c){if(b.set.call(this,c),this.__uuid__){var d=this.__uuid__+":"+a,e=BINDINGS;d in e&&__notifyDatasetChanged(this,e[d],d)}},enumerable:b.enumerable},Object.defineProperty(this.prototype,a,setters)):Object.defineProperty(this.prototype,a,b)};var defineBindObject=function(a){if(null!=a){var b=!1;if(a.hasOwnProperty("__uuid__")!==!0){if(Array.isArray(a)&&""+Object.prototype.toString.call(a)!="[object String]")b=!0;else if(""+Object.prototype.toString.call(a)!="[object Object]")return;var c=generateUUID();if(Object.defineProperty(a,"__uuid__",{value:c,enumerable:!1,writable:!1}),Object.defineProperty(a,"notifyDatasetChanged",{value:function(a,b){var c=this.__uuid__+":"+a;c in BINDINGS&&__notifyDatasetChanged(this,BINDINGS[c],c,b)},enumerable:!1,writable:!1}),Object.defineProperty(a,"__owners__",{value:[],enumerable:!1,modifiable:!0}),a.AddToOwners=function(a,b){this.__owners__.push([a,b])},a.RemoveFormOwners=function(a,b){if(this.__owners__)for(var c=this.__owners__.length;c--;){var d=this.__owners__[c];if(d[0]==a&&d[1]==b){this.__owners__.slice(c,1);break}}},b)return void(a.__proto__=DBArray);for(obj_k in a)if("function"!=typeof a[obj_k]&&"_"!=obj_k.substr(0,1)){a[obj_k];Object.defineProperty(a,"__"+obj_k,{value:a[obj_k],enumerable:!1,writable:!0}),__define_property(a,obj_k),void 0!=a[obj_k]&&(defineBindObject(a[obj_k]),void 0!=a[obj_k]&&a[obj_k].AddToOwners&&a[obj_k].AddToOwners(a,obj_k))}}}},DBArray=Object.create(Array);DBArray.push=function(){if(Array.prototype.push.apply(this,arguments),this.__owners__){var a={action:"PUSH",value:arguments.length};for(owi=0;owi<this.__owners__.length;owi++)ow=this.__owners__[owi],ow[0].notifyDatasetChanged&&ow[0].notifyDatasetChanged(ow[1],a)}},DBArray.splice=function(){if(Array.prototype.splice.apply(this,arguments),extra={action:"SPLICE",index:arguments[0],howmany:arguments[1],count:arguments.length-2},this.__owners__)for(owi=0;owi<this.__owners__.length;owi++)ow=this.__owners__[owi],ow[0].notifyDatasetChanged&&ow[0].notifyDatasetChanged(ow[1],extra)},DBArray.pop=function(){var a=Array.prototype.pop(this,arguments);if(this.__owners__){var b={action:"POP"};for(owi=0;owi<this.__owners__.length;owi++)ow=this.__owners__[owi],ow[0].notifyDatasetChanged&&ow[0].notifyDatasetChanged(ow[1],b)}return a},DBArray.shift=function(){if(p=Array.prototype.shift.apply(this,arguments),extra={action:"SHIFT"},this.__owners__)for(owi=0;owi<this.__owners__.length;owi++)ow=this.__owners__[owi],ow[0].notifyDatasetChanged&&ow[0].notifyDatasetChanged(ow[1],extra);return p},DBArray.unshift=function(){if(p=Array.prototype.unshift.apply(this,arguments),extra={action:"UNSHIFT",value:arguments.length},this.__owners__)for(owi=0;owi<this.__owners__.length;owi++)ow=this.__owners__[owi],ow[0].notifyDatasetChanged&&ow[0].notifyDatasetChanged(ow[1],extra);return p},DBArray.set=function(a,b){if(old=this[b].__uuid__,this[b]=a,extra={action:"SET",index:b},this.__owners__)for(owi=0;owi<this.__owners__.length;owi++)ow=this.__owners__[owi],ow[0].notifyDatasetChanged&&ow[0].notifyDatasetChanged(ow[1],extra)},__prop_binding.prototype={get converter_params(){return this._converter_params},set converter_params(a){if(null==a)this._converter_params=null;else if("["==a[0]&&"]"==a[a.length-1])for(a=a.substring(1,a.length-1),this._converter_params=[],vs=a.split(","),vp=0;vp<vs.length;vp++)p=vs[vp],this._converter_params.push(__unstringify(p));else this._converter_params=__unstringify(a)},get fallback(){return this._fallback},set fallback(a){this._fallback=__unstringify(a)}},__prop_binding.prototype.init=function(a){},__prop_binding.prototype._clean=function(){},__prop_binding.prototype.getBindingKeys=function(a){var a=a||this,b=a.alt;if(b=b?b.split(","):[],null!=this.converter_params)for(var c=this.converter_params.length,d=null;c--;)d=this.converter_params[c],"$"==d[0]&&(d=d.substring(1),b.push(d));return b.push(a.from),b},__prop_binding.prototype.populate=function(a,b,c){null==a&&(a=this.fallback),a=this.convert_value(a,b),_dom_batch_.dom_batch_set_property(this._element,this.to,a),this._key_uuid_=b.__uuid__+":"+this.from},__prop_binding.prototype.convert_value=function(value,context){if(null!=this.converter){var p=null,cp=null,key=null,keys=null,v=null;if(null!=this.converter_params)if(Array.isArray(this.converter_params)){p=[];for(var cpi=this.converter_params.length;cpi--;)if(cp=this.converter_params[cpi],"$"==cp[0]){key=cp.slice(1),v=context,keys=key.split("."),"global"==keys[0]&&(v=CONTEXT,keys=keys.slice(1));for(var k=0,e=keys.length;k<e;k++){if(!((k=keys[k])in v)){v=null;break}v=v[k]}p.push(v)}else p.push(cp)}else cp=this.converter_params,"$"==cp[0]?(key=cp.slice(1))in context&&(p=context[key]):p=cp;this.converter.startsWith("ftw2:")?(converter=this.converter.substr(5),value=eval(converter)(value,p)):value=this.converter in CONTEXT&&CONTEXT[this.converter]instanceof Function?CONTEXT[this.converter](value,p):window[this.converter](value,p)}return value},__prop_binding.prototype.clone=function(a){infos={};for(k in this._infos)infos[k]=this._infos[k];return infos.process_event=!0,infos._element=a.querySelector(this._path),__create_binding_from_infos(infos)},__textContent_binding.prototype=new __prop_binding,__textContent_binding.prototype.populate=function(a,b,c){null==a&&(a=this.fallback),a=""+this.convert_value(a,b);var d=this._element.textContent,e=0==this._index?"":d.substring(0,this._index),f=d.substring(this._index+this._length);this._length=a.length,_dom_batch_.dom_batch_set_property(this._element,"textContent",e+a+f),this._key_uuid_=b.__uuid__+":"+this.from},__attr_binding.prototype=new __prop_binding,__attr_binding.prototype.populate=function(a,b,c){null==a&&(a=this.fallback),a=""+this.convert_value(a,b);var d=this._element.getAttribute("data-binded-"+this.to);null==d&&(d=this._element.getAttribute(this.to));var e=0==this._index?"":d.substring(0,this._index),f=d.substring(this._index+this._length),g=e+a+f;_dom_batch_.dom_batch_set_attribute(this._element,this.to,g),this._key_uuid_=b.__uuid__+":"+this.from},__model_binding.prototype=new __prop_binding,__model_binding.prototype._clean=function(a,b,c){if(null==a&&(a=this._element),void 0==b&&(b=a.firstChild),void 0==c&&(c=0),null!=b){var d=b._ftw2_type,e=this._generated_keys.splice(c,1)[0],f={};if(e){var g=null,h=null,c=0;for(var i in e){g=e[i],glob_binding=BINDINGS[i];for(var j=g.length;j--;){h=g[j],h._clean(),h.context&&(h.context=null),glob_binding&&i in glob_binding&&(c=glob_binding[i].indexOf(h),glob_binding[i].splice(c,1)[0],0==glob_binding[i].length&&delete glob_binding[i]);var k=h.from;k in f||(f[k]=[]),f[k].push(h)}}}removeChildAndClearEvents(a,b);MODELS[d].recycle.push([b,f])}},__model_binding.prototype._process_fallback=function(){var a=this.presenter;return a+"_fallback"in MODELS?this._populate_model(CONTEXT,a,"fallback",!1):this.fallback?this._populate_model(CONTEXT,this.fallback,"fallback",!1):document.createTextNode("")},__model_binding.prototype._populate_model=function(a,b,c,d){defineBindObject(a);var a=this.convert_value(a,b),e=null,f=null,g=(c||a.constructor.name,b||this.presenter),h=null,i=[],j=d||this.deep||!0,f=null,e=null,k=null,l=a;if(this._ftw2_type=null,"fallback"==c){var m=MODELS[g+"_fallback"];m&&(f=m.bindings,e=m.template,k=m.recycle,this._ftw2_type=g+"_fallback")}else if("empty"==c){var m=MODELS[g+"_empty"];m&&(f=m.bindings,e=m.template,k=m.recycle,this._ftw2_type=g+"_empty")}else for(;null!=l;){var n=g+"_"+l.constructor.name;if(n in MODELS){var m=(l.constructor.name,MODELS[n]);if(m){f=m.bindings,e=m.template,k=m.recycle,this._ftw2_type=n;break}}l=l.__proto__}if(null==e){"defaut";var m=MODELS[g];m&&(f=m.bindings,e=m.template,k=m.recycle,this._ftw2_type=g)}if(null!=e){if(k.length>0){var o=k.pop();h=o[0],f=o[1];for(var p in f){for(var q=[],r=f[p].length;r--;){var s=f[p][r];if(a.__uuid__)for(var t=s.getBindingKeys(),u=t.length;u--;){var v=t[u],w=a.__uuid__+":"+v;j===!0&&(w in BINDINGS?BINDINGS[w].push(s):BINDINGS[w]=[s]),w in i?i[w].push(s):i[w]=[s]}q.push(s),s.init(a)}__notifyDatasetChanged(a,q,p)}}else{var x=e.cloneNode(!0);h=x;for(var p in f){for(var q=[],r=f[p].length;r--;){var y={},z=f[p][r];for(var A in z)y[A]=z[A];y.process_event=!0,y._element=x,y.path&&(y._element=x.querySelector(y.path));var s=__create_binding_from_infos(y);if(a.__uuid__)for(var t=this.getBindingKeys(y),u=t.length;u--;){var v=t[u],w=a.__uuid__+":"+v;j===!0&&(w in BINDINGS?BINDINGS[w].push(s):BINDINGS[w]=[s]),w in i?i[w].push(s):i[w]=[s]}q.push(s),s.init(a)}__notifyDatasetChanged(a,q,p)}}return h._ftw2_type=this._ftw2_type,this._generated_keys.push(i),h}},__model_binding.prototype.populate_object=function(a,b,c,d){this._clean(d),null==a?d.appendChild(this._process_fallback()):d.appendChild(this._populate_model(a))},__model_binding.prototype.populate_array=function(a,b,c,d){if(defineBindObject(b),null==a){for(this._empty=!0;d.firstChild;)removeChildAndClearEvents(d,d.firstChild);return void d.appendChild(this.process_fallback())}if(0==a.length){for(this._empty=!0;d.firstChild;)removeChildAndClearEvents(d,d.firstChild);return void(this.empty&&d.appendChild(this._populate_model(CONTEXT,this.empty,"empty",!1)))}if(this._empty){for(;d.firstChild;)removeChildAndClearEvents(d,d.firstChild);this._empty=!1}if(null!=c)switch(c.action){case"SET":var e=c.index;this._clean(d,d.children[e],e);var f=a[e],g=this._populate_item(f),h=0==e?d.firstChild:d.children[e-1];return void d.insertBefore(g,h);case"POP":return void this._clean(d,d.children[d.children.length-1],d.children.length-1);case"PUSH":for(var j=c.value,k=[],l=a.length-j,m=a.length-1;m>=l;m--)k.push(a[m]);for(var e=0;e<k.length;e++){var f=k[e],g=this._populate_item(f);d.appendChild(g)}return;case"SHIFT":return void this._clean(d,d.children[0],0);case"UNSHIFT":for(var j=c.value,k=[],m=j-1;m>=0;m--)k.push(a[m]);for(var e=0;e<k.length;e++){var f=k[e],g=this._populate_item(f);d.insertBefore(g,d.firstChild)}return;case"SPLICE":for(var n=c.index,o=c.howmany,j=c.count,e=n;e<n+o;e++)this._clean(d,d.children[n],e);if(void 0!=j&&j>0){for(var k=[],h=d.children[n],m=j-1;m>=0;m--)k.push(a[n+m]);for(var e=0;e<k.length;e++){var f=k[e],g=this._populate_item(f);d.insertBefore(g,h)}}return}var p=d.children;if(null==p){p=[];var q=d.childNodes,r=q.length;for(i=0;i<r;i++)8==q[i].nodeType||3==q[i].nodeType&&!/\S/.test(q[i].nodeValue)||p.push(q[i])}for(var e=p.length-1;e>=0;e--)this._clean(d,p[e],e);for(var e=0;e<a.length;e++){var f=a[e],g=this._populate_item(f);d.appendChild(g)}this._key_uuid_=b.__uuid__+":"+this.from},__model_binding.prototype._populate_item=function(a,b,c){if(null==a)return this._process_fallback();var d=this._populate_model(a);return this._key_uuid_=a.__uuid__+":"+this.from,d},__model_binding.prototype.populate=function(a,b,c){var d=document.createDocumentFragment(),e=this._element.nextSibling,b=this._element.parentNode,f=this._element;f.firstChild&&3===f.firstChild.nodeType&&f.removeChild(f.firstChild),d.appendChild(f),a&&(a.__proto__==DBArray||a instanceof Array)?this.populate_array(a,b,c,f):this.populate_object(a,b,c,f),e?_dom_batch_.dom_batch_insertBefore(b,f,e):_dom_batch_.dom_batch_append_child(b,f)};var cb_pr={get command_params(){return this._cmd_parameters},set command_params(a){if(null==a)this._cmd_parameters=null;else if("["==a[0]&&"]"==a[a.length-1]){a=a.substring(1,a.length-2),this._cmd_parameters=[];for(var b=a.split(","),c=b.length,d=0;d<c;d++)this._cmd_parameters.push(b[d])}else this._cmd_parameters=[a]}};cb_pr.__proto__=new __prop_binding,__command_binding.prototype=cb_pr,__command_binding.prototype.init=function(a){this.context=a,null!=this.command&&null!=this.to&&this._element.addEventListener(this.to,this.__process_event)},__command_binding.prototype.populate=function(a,b,c){},__command_binding.prototype._clean=function(){this._element.removeEventListener(this.to,this.__process_event),this.context=null},__input_binding.prototype=new __prop_binding,__input_binding.prototype.init=function(a){this._element.addEventListener(this._event,this.on_process_event),this.context=a},__input_binding.prototype._clean=function(){this._element.removeEventListener(this._event,this.on_process_event),this.context=null},__input_binding.prototype.mirror=function(a){this._pass=!0,ctx=null==this.context?CONTEXT:this.context,ctx[this.from]=a,this._pass=!1},__input_binding.prototype.populate=function(a,b,c){if(!this._pass){if(null===(a=this.convert_value(a,b))||void 0===a||""===a)return _dom_batch_.dom_batch_set_property(this._element,"placeholder",this.fallback),void("value"==this.to?_dom_batch_.dom_batch_set_property(this._element,"value",""):_dom_batch_.dom_batch_set_property(this._element,this.to,this.fallback));_dom_batch_.dom_batch_set_property(this._element,this.to,a)}};var __webservice_param_regex=new RegExp(/([\w_-]+)=(\??\$\w[\w_\d]+)/g);__webservice_parameter.prototype.getParameter=function(a){if(value=a[this.value],null==value){if(this.important)throw Error();return this.name+"="}return this.name+"="+encodeURI(value)},__webservice_parameter.prototype.toString=function(){return this.value},__webservice_url.prototype.getURL=function(a){try{if(url=this._url,this._param_str.length>0){for(url+="?",str=this._param_str,upi=0;upi<this._params.length;upi++)v=this._params[upi].getParameter(a),str=str.replace("{"+upi+"}",v);url+=str}return url}catch(a){return null}},__webservice_url.prototype.getParametersNames=function(){return this._params.join(",")};var xhr_timeout=4e3;__webservice_model_binding.prototype=new __model_binding,__webservice_model_binding.prototype.init=function(a){if(void 0!=this._url&&void 0==a[this._prop_name]){a[this._prop_name]=null;var b=this._prop_name;Object.defineProperty(a,this.from,{get:function(){return this[b]}})}},__webservice_model_binding.prototype.populate=function(a,b,c){c?__model_binding.prototype.populate.call(this,a,b):(url=this._url.getURL(b),url&&__load_async_datas(url,b,this._prop_name,this.from))};var __uuid_date=null,BATCH_RECYCLE=[],BATCH_APPEND=0,BATCH_REMOVE=1,BATCH_INSERT_BEFORE=2,BATCH_SET_ATTRIBUTE=3,BATCH_SET_PROPERTY=4;r_a_f=window.requestAnimationFrame||win.webkitRequestAnimationFrame||win.mozRequestAnimationFrame||function(a){return setTimeout(a,16)};var _dom_batch_=new dom_batch,CONTEXT=null,BINDINGS=[],MODELS={},__verif_regex__=new RegExp(/[^\{]*(\{binding[^\}]+\})/g),__regex__=new RegExp(/(?:\s+([\w_\-]+):((?:https?:\/\/[^ ]+)|(?:(?:ftw2:)?\w[\w_\d]+)|(?:\$\w[\w_\d]+)|(?:'[^']+')|(?:\[[\$']?[\$'\w\s,\._;%\-]+(?:,[\$']?[\$'\w\s,\._;%\-]+)*\])|(?:[^\s\}]+)))/g);window.addEventListener("load",AppInit)});
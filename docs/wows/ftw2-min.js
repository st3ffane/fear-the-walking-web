!function(a,b){"function"==typeof define&&define.amd?define([],function(){return b()}):"object"==typeof exports?module.exports=b():b()}(this,function(){function __define_property(a,b){Object.defineProperty(a,b,{get:function(){return this["__"+b]},set:function(a){var c=this["__"+b];null!=a&&defineBindObject(a),null!=c&&c.RemoveFromOwners&&c.RemoveFromOwners(this,b),null!=a&&a.AddToOwners&&a.AddToOwners(this,b),this["__"+b]=a}})}function __prop_binding(a){null!=a&&(this._path=a.path,this.to=a.to,this.from=a.from,this.mode=a.mode,this.converter=a.converter,this._converter_params=null,this._fallback=null,this.converter_params=a.converter_params,this.fallback=a.fallback,this.alt=a.alt,this.root=a.root,this._element=a._element,this._key_uuid_=null)}function __textContent_binding(a){__prop_binding.call(this,a),this._index=a._index,this._length=a._length}function __attr_binding(a){__prop_binding.call(this,a),this._index=a._index,this._length=a._length}function __model_binding(a){if(null!=a&&(this.deep=a.deep,__prop_binding.call(this,a),this.presenter=a.presenter,this.merge=a.merge,this.empty=a.empty,model=document.getElementById(this.presenter),model)){this._root_model=model,this._cache_types={};var b=model.children;if(null==b){b=[];var c=model.childNodes,d=c.length;for(i=0;i<d;i++)if(8!=c[i].nodeType&&(3!=c[i].nodeType||/\S/.test(c[i].nodeValue))){b.push(c[i]);break}}for(var e=b.length;e--;){var f=b[e],g="defaut";f.hasAttribute("data-type")&&(g=f.getAttribute("data-type")),this._cache_types[g]=f}this.fallback&&(this._cache_types.fallback=document.getElementById(this.fallback)),this.empty&&(this._cache_types.empty=document.getElementById(this.empty))}}function __array_binding(a){__model_binding.call(this,a),this._empty=!1}function __array_insert_order(a,b,c){for(li=0;li<a.length;li++)if(pitem=a[li],b[c]<pitem[c])return void a.splice(li,0,b);a.push(b)}function __command_binding(a){__prop_binding.call(this,a),a.from=this.from="COMMANDS",this.context=null,this.command=a.command,this._cmd_parameters=null,this.command_params=a.command_params}function __input_binding(a){__prop_binding.call(this,a),this._pass=!1,this.return_value=a.return_value,this._event=null==a.event?"change":a.event,a.process_event&&this.init(CONTEXT)}function __webservice_parameter(a,b){this.name=a,this.value=b,this.important=!0,b.startsWith("$")?this.value=b.substr(1):(this.value=b.substr(2),this.important=!1)}function __webservice_url(a){this._url=a,this._params=[],this._param_str="";var b=a.indexOf("?");if(-1!=b&&(this._url=a.substr(0,b),param_str=a.substr(b+1),match=__webservice_param_regex.exec(param_str),match)){for(params=[],pi=0;match;)str=match[0],name=match[1],value=match[2],this._params.push(new __webservice_parameter(name,value)),param_str=param_str.replace(str,"{"+pi+"}"),pi++,__webservice_param_regex.lastIndex=0,match=__webservice_param_regex.exec(param_str);this._param_str=param_str}}function WEBSERVICE_LOADING(a){this.message=a}function WEBSERVICE_ERROR(a){this.message=""+a}function WEBSERVICE_TIMEOUT(a){this.message=""+a}function __load_async_datas(a,b,c,d){var e=new XMLHttpRequest;b[c]=new WEBSERVICE_LOADING,b.notifyDatasetChanged(d,1),e.onload=function(a){if(200!==e.status)return b[c]=new WEBSERVICE_ERROR(e.responseText),void b.notifyDatasetChanged(d,1);if(datas=e.response,null==datas)return b[c]=null,void b.notifyDatasetChanged(d,1);if(type=e.getResponseHeader("content-type"),type.startsWith("application/json"))try{datas=JSON.parse(datas)}catch(f){datas=new WEBSERVICE_ERROR("Erreur lors du parse JSON")}else this.reader&&(datas=window[this.reader](datas));b[c]=datas,b.notifyDatasetChanged(d,1)},e.onerror=function(a){b[c]=new WEBSERVICE_ERROR(a),b.notifyDatasetChanged(d,1)},e.timeout=xhr_timeout,e.ontimeout=function(a){b[c]=new WEBSERVICE_TIMEOUT(a),b.notifyDatasetChanged(d,1)},e.open("GET",a),e.send()}function __webservice_model_binding(a){if(__model_binding.call(this,a),this.reader=a.reader,1==this.from.startsWith("http://")||1==this.from.startsWith("https://")){this._url=new __webservice_url(this.from),this.from=a.as||generateUUID(),this._prop_name="_"+this.from;var b=this._url.getParametersNames();b&&(void 0==this.alt?this.alt=b:this.alt+=","+b)}}function generateUUID(){return __uuid_date=(new Date).getTime(),"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,__replace_uuid)}function __replace_uuid(a){var b=__uuid_date,c=(b+16*Math.random())%16|0;return b=Math.floor(b/16),("x"==a?c:3&c|8).toString(16)}function getDomPath(a,b){var c=a;if(c){for(var d=[];c!=b&&null!=c.parentNode;){if(c.hasAttribute("id")&&""!=c.id)d.unshift(c.nodeName.toLowerCase()+"#"+c.id);else{for(var e=0,f=0,g=c.nodeName,h=c.parentNode.childNodes.length,i=c.parentNode.childNodes,j=0;h>j;j++){var k=i[j];if(k.nodeName==g){if(k===c){f=e;break}e++}}f>0?d.unshift(g+":nth-of-type("+(f+1)+")"):d.unshift(g)}c=c.parentNode}return d.join(" > ")}}function check_radio_value(a,b){return a?a==b:null}function __unstringify(a){return null!=a&&"'"==a[0]&&"'"==a[a.length-1]&&(a=a.substring(1,a.length-1)),a}function addCommandListener(a,b,c){a.addEventListener(b,c),a.eventListenerList||(a.eventListenerList={}),a.eventListenerList[b]||(a.eventListenerList[b]=[]),a.eventListenerList[b].push(c)}function removeChild(a,b){a._removeChild(b),clear_events(b)}function clear_events(a){if(a.eventListenerList){var b=null,c=0;for(key in a.eventListenerList)for(b=a.eventListenerList[key],c=b.length;c--;)a.removeEventListener(key,b[c]),a._input_binding&&(a._input_binding=null),a._cmd_binding&&(a._cmd_binding=null)}if(a.children)for(var d=null,e=a.children.length;e--;)d=a.children[e],clear_events(d)}function notifyDatasetChanged(a,b){if(null==a||""==a){var c=null,d=null,e=null;for(a in BINDINGS){for(c=a.split(":")[1],d=[],i=0;i<BINDINGS[a].length;i++)e=BINDINGS[a][i],"COMMANDS"!=e.from&&e.from!=c||d.push(e);__notifyDatasetChanged(CONTEXT,d,a)}}else CONTEXT.process_update=!0,a in BINDINGS&&__notifyDatasetChanged(CONTEXT,BINDINGS[a],a,b),CONTEXT.process_update=!1}function __notifyDatasetChanged(a,b,c,d){var e=0,f=null,g=null;for(var h in b)e=null,f=b[h],"$this"==c||"$this"==f.from?e=a:(g=f.from,null!=a&&g in a&&(e=a[g])),f.populate(e,a,d)}function __get_bindings(a,b,c){for(var d=c||".//*[contains(text(),'{binding ') or @*[contains(.,'{binding ')]]",e=document.evaluate(d,a,null,XPathResult.ORDERED_NODE_ITERATOR_TYPE,null),f=e.iterateNext(),g=[],h=null;null!=f;)h=__get_binding_from_attributes(f,a,b),null!=h&&0!=h.length?(__prepare_binding(h,b,g),f=e.iterateNext()):f=e.iterateNext();return h=__get_binding_from_attributes(a,a,b),null!=h&&h.length>0&&__prepare_binding(h,b,g),g}function __prepare_binding(a,b,c){for(var d=a.length,e=null,f=null;d--;)if(binding=a[d],e=null==binding.from?binding.command:binding.from,null!=e)if(b){f=binding.getBindingKeys();for(var g=f.length;g--;){var h=f[g];h=CONTEXT.__uuid__+":"+h,h in c?c[h].push(binding):c[h]=[binding]}}else e in c?c[e].push(binding):c[e]=[binding]}function __get_binding_from_attributes(a,b,c){for(var d=[],e=a.attributes,f=e.length;f--;){attr=a.attributes[f];var g=__parse_attribute(a,b,attr.nodeName,attr.value,c);null!=g&&d.push(g)}for(var h=a.childNodes,i="",j=0;j<h.length;j++)3==h[j].nodeType&&(i+=h[j].textContent);if(i.trim(),""!=i){var g=__parse_attribute(a,b,"innerHTML",i,c);null!=g&&d.push(g)}return d}function __parse_attribute(a,b,c,d,e){var f=d;if(null==f||""==f)return null;var g=__verif_regex__.exec(f);if(null==g)return null;f=g[1];var h=[];h._element=a,h.root=b,h.path=getDomPath(a,b);var i=c;0==i.indexOf("data-binded-")&&(i=i.split("-")[2]),h.to=i;var j=__verif_regex__.lastIndex-f.length;h._index=j,h._length=f.length;for(var k=__regex__.exec(f);null!=k;)h[k[1]]=k[2],k=__regex__.exec(f);if(__regex__.lastIndex=0,__verif_regex__.lastIndex=0,null==h.from&&null==h.command)return null;h.process_event=e;var l=h;return e&&(l=__create_binding_from_infos(h),l.init(CONTEXT)),l}function __create_binding_from_infos(a){return null!=a.presenter?(a.to="innerHTML",1==a.from.startsWith("http://")||1==a.from.startsWith("https://")?new __webservice_model_binding(a):new __model_binding(a)):null!=a.item_presenter?(a.to="innerHTML",a.presenter=a.item_presenter,a.item_presenter=null,new __array_binding(a)):null!=a.command?new __command_binding(a):"2way"==a.mode?("input"==a._element.localName&&("radio"==a._element.getAttribute("type")&&"checked"==a.to?(a.return_value=!0,void 0==a.event&&(a.event="click"),void 0==a.converter&&(a.converter="ftw2:check_radio_value",a.converter_params="'"+a._element.value+"'")):"text"==a._element.getAttribute("type")&&null!=a._element.getAttribute("list")&&(a.event="input")),new __input_binding(a)):"innerHTML"==a.to?new __textContent_binding(a):null==a.forceAttr&&a.to in a._element?new __prop_binding(a):new __attr_binding(a)}function AppInit(){if(ctx=document.body.getAttribute("data-context"),null==ctx)throw"No context defined!";if(CONTEXT=window[ctx],null==CONTEXT)throw"No context defined!";defineBindObject(CONTEXT),CONTEXT.__process_update=!1,Object.defineProperty(CONTEXT,"process_update",{get:function(){return this.__process_update},set:function(a){this.__process_update!=a&&(this.__process_update=a,key=this.__uuid__+":process_update",key in BINDINGS&&__notifyDatasetChanged(this,BINDINGS[key],key))},enumerable:!1}),CONTEXT.__end_init=!1,Object.defineProperty(CONTEXT,"end_init",{get:function(){return this.__end_init},set:function(a){this.__end_init!=a&&(this.__end_init=a,key=this.__uuid__+":end_init",key in BINDINGS&&__notifyDatasetChanged(this,BINDINGS[key],key))},enumerable:!1});var a=document.querySelector("body>div[data-role='presenters']");if(null!=a)for(a.style.display="none",models=a.querySelectorAll("body>div[data-role=presenters]>[data-role=presenter]"),moi=0;moi<models.length;moi++){var b=models[moi];if(id=b.getAttribute("id"),null!=id&&(null!=b.children||null!=b.childNodes)){if(children=b.children,null==children){children=[],end=b.childNodes.length,current=0,cn=b.childNodes;do node=cn[current],8==node.nodeType||3==node.nodeType&&!/\S/.test(node.nodeValue)||children.push(node),current++;while(current<end)}if(1==children.length)MODELS[id]=__get_bindings(children[0],!1);else for(c_i=0;c_i<children.length;c_i++)mdl=children[c_i],dtype=mdl.getAttribute("data-type"),null==dtype?MODELS[id]=__get_bindings(mdl,!1):MODELS[id+"_"+dtype]=__get_bindings(mdl,!1)}}BINDINGS=__get_bindings(document.body,!0,"//*[not(ancestor::div[@data-role='presenters']) and (@*[contains(.,'{binding ')] or contains(text(),'{binding ')) ]"),notifyDatasetChanged(),CONTEXT.end_init=!0}Object._defineProperty=Object.defineProperty,Object.defineProperty=function(a,b,c){c.set?(setters={get:function(){return c.get.call(this)},set:function(a){if(c.set.call(this,a),this.__uuid__){var d=this.__uuid__+":"+b,e=BINDINGS;d in e&&__notifyDatasetChanged(this,e[d],d)}}},Object._defineProperty(a,b,setters)):Object._defineProperty(a,b,c)};var defineBindObject=function(a){if(null!=a){var b=!1;if(a.hasOwnProperty("__uuid__")!==!0){if(Array.isArray(a)&&""+Object.prototype.toString.call(a)!="[object String]")b=!0;else if(""+Object.prototype.toString.call(a)!="[object Object]")return;var c=generateUUID();if(Object.defineProperty(a,"__uuid__",{value:c,enumerable:!1,writable:!1}),Object.defineProperty(a,"notifyDatasetChanged",{value:function(a,b){var c=this.__uuid__+":"+a;c in BINDINGS&&__notifyDatasetChanged(this,BINDINGS[c],c,b)},enumerable:!1,writable:!1}),Object.defineProperty(a,"__owners__",{value:[],enumerable:!1,modifiable:!0}),a.AddToOwners=function(a,b){this.__owners__.push([a,b])},a.RemoveFormOwners=function(a,b){if(this.__owners__)for(var c=this.__owners__.length;c--;){var d=this.__owners__[c];if(d[0]==a&&d[1]==b){this.__owners__.slice(c,1);break}}},b)return void(a.__proto__=DBArray);for(obj_k in a)if("function"!=typeof a[obj_k]&&"_"!=obj_k.substr(0,1)){a[obj_k];Object.defineProperty(a,"__"+obj_k,{value:a[obj_k],enumerable:!1,writable:!0}),__define_property(a,obj_k),void 0!=a[obj_k]&&(defineBindObject(a[obj_k]),void 0!=a[obj_k]&&a[obj_k].AddToOwners&&a[obj_k].AddToOwners(a,obj_k))}}}},DBArray=Object.create(Array);DBArray.push=function(){if(Array.prototype.push.apply(this,arguments),this.__owners__){var a={action:"PUSH",value:arguments.length};for(owi=0;owi<this.__owners__.length;owi++)ow=this.__owners__[owi],ow[0].notifyDatasetChanged&&ow[0].notifyDatasetChanged(ow[1],a)}},DBArray.splice=function(){if(Array.prototype.splice.apply(this,arguments),extra={action:"SPLICE",index:arguments[0],howmany:arguments[1],count:arguments.length-2},this.__owners__)for(owi=0;owi<this.__owners__.length;owi++)ow=this.__owners__[owi],ow[0].notifyDatasetChanged&&ow[0].notifyDatasetChanged(ow[1],extra)},DBArray.pop=function(){var a=Array.prototype.pop(this,arguments);if(this.__owners__){var b={action:"POP"};for(owi=0;owi<this.__owners__.length;owi++)ow=this.__owners__[owi],ow[0].notifyDatasetChanged&&ow[0].notifyDatasetChanged(ow[1],b)}return a},DBArray.shift=function(){if(p=Array.prototype.shift.apply(this,arguments),extra={action:"SHIFT"},this.__owners__)for(owi=0;owi<this.__owners__.length;owi++)ow=this.__owners__[owi],ow[0].notifyDatasetChanged&&ow[0].notifyDatasetChanged(ow[1],extra);return p},DBArray.unshift=function(){if(p=Array.prototype.unshift.apply(this,arguments),extra={action:"UNSHIFT",value:arguments.length},this.__owners__)for(owi=0;owi<this.__owners__.length;owi++)ow=this.__owners__[owi],ow[0].notifyDatasetChanged&&ow[0].notifyDatasetChanged(ow[1],extra);return p},DBArray.set=function(a,b){if(old=this[b].__uuid__,this[b]=a,extra={action:"SET",index:b},this.__owners__)for(owi=0;owi<this.__owners__.length;owi++)ow=this.__owners__[owi],ow[0].notifyDatasetChanged&&ow[0].notifyDatasetChanged(ow[1],extra)},__prop_binding.prototype={get converter_params(){return this._converter_params},set converter_params(a){if(null==a)this._converter_params=null;else if("["==a[0]&&"]"==a[a.length-1])for(a=a.substring(1,a.length-1),this._converter_params=[],vs=a.split(","),vp=0;vp<vs.length;vp++)p=vs[vp],this._converter_params.push(__unstringify(p));else this._converter_params=__unstringify(a)},get fallback(){return this._fallback},set fallback(a){this._fallback=__unstringify(a)}},__prop_binding.prototype.init=function(a){},__prop_binding.prototype.getBindingKeys=function(a){var a=a||this,b=a.alt;if(b=b?b.split(","):[],null!=this.converter_params)for(var c=this.converter_params.length,d=null;c--;)d=this.converter_params[c],"$"==d[0]&&(d=d.substring(1),b.push(d));return b.push(a.from),b},__prop_binding.prototype.populate=function(a,b,c){null==a&&(a=this.fallback),a=this.convert_value(a,b),this._element[this.to]=a,this._key_uuid_=b.__uuid__+":"+this.from},__prop_binding.prototype.convert_value=function(value,context){if(null!=this.converter){var p=null,cp=null,key=null,keys=null,v=null;if(null!=this.converter_params)if(Array.isArray(this.converter_params)){p=[];for(var cpi=this.converter_params.length;cpi--;)if(cp=this.converter_params[cpi],"$"==cp[0]){key=cp.slice(1),v=context,keys=key.split("."),"global"==keys[0]&&(v=CONTEXT,keys=keys.slice(1));for(var k=0,e=keys.length;e>k;k++){if(k=keys[k],!(k in v)){v=null;break}v=v[k]}p.push(v)}else p.push(cp)}else cp=this.converter_params,"$"==cp[0]?(key=cp.slice(1),key in context&&(p=context[key])):p=cp;this.converter.startsWith("ftw2:")?(converter=this.converter.substr(5),value=eval(converter)(value,p)):value=window[this.converter](value,p)}return value},__prop_binding.prototype.clone=function(a){infos={};for(k in this._infos)infos[k]=this._infos[k];return infos.process_event=!0,infos._element=a.querySelector(this._path),__create_binding_from_infos(infos)},__textContent_binding.prototype=new __prop_binding,__textContent_binding.prototype.populate=function(a,b,c){null==a&&(a=this.fallback),a=""+this.convert_value(a,b);var d=this._element.textContent,e=0==this._index?"":d.substring(0,this._index),f=d.substring(this._index+this._length);this._length=a.length,this._element.textContent=e+a+f,this._key_uuid_=b.__uuid__+":"+this.from},__attr_binding.prototype=new __prop_binding,__attr_binding.prototype.populate=function(a,b,c){null==a&&(a=this.fallback),a=""+this.convert_value(a,b);var d=this._element.getAttribute("data-binded-"+this.to);null==d&&(d=this._element.getAttribute(this.to));var e=0==this._index?"":d.substring(0,this._index),f=d.substring(this._index+this._length);this._element.setAttribute(this.to,e+a+f),this._key_uuid_=b.__uuid__+":"+this.from},__model_binding.prototype=new __prop_binding,__model_binding.prototype._clean=function(a){if(null!=a.firstChild){var b=a.firstChild._ftw2_keys;if(b){var c=null,d=null,e=0,f=null;for(var g in b){c=b[g];for(var h=c.length;c--;)d=c[h],d.context&&(d.context=null),e=BINDINGS[g].indexOf(d),f=BINDINGS[g].splice(e,1)[0],0==BINDINGS[g].length&&delete BINDINGS[g]}this._current_keys={}}removeChild(a,a.firstChild)}},__model_binding.prototype._process_fallback=function(){if(null==this.fallback){var a=this.presenter,b=a+"_fallback";if(b in MODELS)return this._populate_model(CONTEXT,a,"fallback",!1)}else if(this._cache_fallback)return this._populate_model(CONTEXT,this.fallback,"fallback",!1)},__model_binding.prototype._populate_model=function(a,b,c,d){defineBindObject(a);var e=null,f=null,g=c||a.constructor.name||"defaut",h=b||this.presenter,i=null,j=[],k=d||this.deep||!0,f=null,e=null,l=a,g="";if("fallback"==c)f=MODELS[h+"_fallback"],e=this._cache_types.fallback;else if("empty"==c)f=MODELS[h+"_empty"],e=this._cache_types.empty;else for(;null!=l;){var m=h+"_"+l.constructor.name;if(m in MODELS){var g=l.constructor.name;f=MODELS[m],e=this._cache_types[g];break}l=l.__proto__}if(null==e&&(g="defaut",f=MODELS[h],e=this._cache_types.defaut),null==e)return void(this._element[this.to]=" unknown model! "+a);var n=e.cloneNode(!0);n._ftw2_type=g,i=n;for(var o in f){for(var p=[],q=f[o].length;q--;){var r={},s=f[o][q];for(var t in s)r[t]=s[t];r.process_event=!0,r._element=n,r.path&&(r._element=n.querySelector(r.path));var u=__create_binding_from_infos(r);if(a.__uuid__&&k===!0)for(var v=this.getBindingKeys(r),w=v.length;w--;){var x=v[w],y=a.__uuid__+":"+x;y in BINDINGS?BINDINGS[y].push(u):BINDINGS[y]=[u],y in j?j[y].push(u):j[y]=[u]}p.push(u),u.init(a)}__notifyDatasetChanged(a,p,o)}return i._ftw2_keys=j,i},__model_binding.prototype.populate=function(a,b,c){var d=(document.createDocumentFragment(),this._element.nextSibling),b=this._element.parentNode,e=this._element,a=this.convert_value(a,b);this._clean(e),null==a?e.appendChild(this._process_fallback()):e.appendChild(this._populate_model(a)),d?b.insertBefore(e,d):b.appendChild(e)},__array_binding.prototype=new __model_binding,__array_binding.prototype._clear_binding=function(a){for(key in a)__notifyDatasetChanged(null,a[key],key)},__array_binding.prototype._clean_child=function(a,b){if(null!=a){var c=a._ftw2_keys;if(c){var d=[];for(var e in c)for(current=c[e],bi=0;bi<current.length;bi++)cr=current[bi],index=BINDINGS[e].indexOf(cr),test=BINDINGS[e].splice(index,1)[0],d.push(test),0==BINDINGS[e].length&&delete BINDINGS[e]}removeChild(b,a)}},__array_binding.prototype.populate=function(a,b,c){var d=document.createDocumentFragment(),e=this._element.nextSibling,f=this._element.parentNode,g=this._element;d.appendChild(g),g.firstChild&&3===g.firstChild.nodeType&&removeChild(g,g.firstChild);var a=this.convert_value(a,b);if(null==a){for(this._empty=!0;g.firstChild;)removeChild(g,g.firstChild);return this.fallback&&g.appendChild(this._populate_model(CONTEXT,this.fallback,"fallback",!1)),void(e?f.insertBefore(g,e):f.appendChild(g))}if(0==a.length){for(this._empty=!0;g.firstChild;)removeChild(g,g.firstChild);return this.empty&&g.appendChild(this._populate_model(CONTEXT,this.empty,"empty",!1)),void(e?f.insertBefore(g,e):f.appendChild(g))}if(this._empty){for(;g.firstChild;)removeChild(g,g.firstChild);this._empty=!1}if(null!=c)switch(c.action){case"SET":var h=c.index;this._clean_child(g.children[h],g);var j=a[h],k=this._populate_item(j);k.__uuid__=j.__uuid__;var l=0==h?g.firstChild:g.children[h-1];return g.insertBefore(k,l),void(e?f.insertBefore(g,e):f.appendChild(g));case"POP":return this._clean_child(g.children[g.children.length-1],g),void(e?f.insertBefore(g,e):f.appendChild(g));case"PUSH":for(var m=c.value,n=[],o=a.length-m,p=a.length-1;p>=o;p--)n.push(a[p]);for(var h=0;h<n.length;h++){var j=n[h],k=this._populate_item(j);k.__uuid__=j.__uuid__,g.appendChild(k)}return void(e?f.insertBefore(g,e):f.appendChild(g));case"SHIFT":return this._clean_child(g.children[0],g),void(e?f.insertBefore(g,e):f.appendChild(g));case"UNSHIFT":for(var m=c.value,n=[],p=m-1;p>=0;p--)n.push(a[p]);for(var h=0;h<n.length;h++){var j=n[h],k=this._populate_item(j);k.__uuid__=j.__uuid__,g.insertBefore(k,g.firstChild)}return void(e?f.insertBefore(g,e):f.appendChild(g));case"SPLICE":for(var q=c.index,r=c.howmany,m=c.count,h=q;q+r>h;h++)this._clean_child(g.children[h],g);if(void 0!=m&&m>0){for(var n=[],l=g.children[q],p=m-1;p>=0;p--)n.push(a[q+p]);for(var h=0;h<n.length;h++){var j=n[h],k=this._populate_item(j);k.__uuid__=j.__uuid__,g.insertBefore(k,l)}}return void(e?f.insertBefore(g,e):f.appendChild(g))}var s=g.children;if(null==s){s=[];var t=g.childNodes,u=t.length;for(i=0;i<u;i++)8==t[i].nodeType||3==t[i].nodeType&&!/\S/.test(t[i].nodeValue)||s.push(t[i])}for(var h=s.length-1;h>=0;h--)this._clean_child(s[h],g);for(var h=0;h<a.length;h++){var j=a[h],k=this._populate_item(j);g.appendChild(k)}this._key_uuid_=b.__uuid__+":"+this.from,e?f.insertBefore(g,e):f.appendChild(g)},__array_binding.prototype._populate_item=function(a,b,c){if(null==a)return this._process_fallback;var d=this._populate_model(a);return this._key_uuid_=a.__uuid__+":"+this.from,d};var cb_pr={get command_params(){return this._cmd_parameters},set command_params(a){if(null==a)this._cmd_parameters=null;else if("["==a[0]&&"]"==a[a.length-1]){a=a.substring(1,a.length-2),this._cmd_parameters=[];for(var b=a.split(","),c=b.length,d=0;c>d;d++)this._cmd_parameters.push(b[d])}else this._cmd_parameters=[a]}};cb_pr.__proto__=new __prop_binding,__command_binding.prototype=cb_pr,__command_binding.prototype.init=function(a){this.context=a,null!=this.command&&null!=this.to&&(addCommandListener(this,this.to,this.__process_event),this._element._cmd_binding=this)},__command_binding.prototype.populate=function(a,b,c){this.init(b)},__command_binding.prototype.__process_event=function(a){if(bind=this._cmd_binding,null!=bind&&null!=bind.context){if(value=bind.command,null==value&&(value=bind.fallback),value=bind.convert_value(value,bind.context),params=null,null!=bind.command_params)for(params=[],cpi=0;cpi<bind.command_params.length;cpi++)"$"==bind.command_params[cpi][0]?(prop=bind.command_params[cpi].substr(1),prop in bind.context?params.push(bind.context[prop]):params.push("null")):params.push(bind.command_params[cpi]);CONTEXT[value](a,params)}},__input_binding.prototype=new __prop_binding,__input_binding.prototype.init=function(a){addCommandListener(this,this._event,this.on_process_event),this.context=a,this._element._input_binding=this},__input_binding.prototype.on_process_event=function(a){var b=this._input_binding;if(null!=b&&null!=b.context){var c=b.return_value===!0?this.value:this[b.to];null!=c&&void 0!=c&&""!=c||(this.placeholder=b.fallback);try{b.mirror(c),this.setCustomValidity("")}catch(d){if(this.setCustomValidity(d.message),this.form)if(this.form.reportValidity)window.setTimeout(function(){b._element.form.reportValidity();var a=b.convert_value(b.context[b.from],b.context);return null===a||void 0===a||""===a?void(b._element.placeholder=this.fallback):(b._element[b.to]=a,void window.setTimeout(function(){b._element.setCustomValidity("")},2e3))});else for(form=b._element.form,i=form.length-1;i>=0;i--){var e=form[i];if("submit"==e.getAttribute("type"))return void window.setTimeout(function(){return e.click(),c=b.convert_value(b.context[b.from],b.context),null===c||void 0===c||""===c?(b._element.placeholder=this.fallback,void(b._element.value="")):(b._element[b.to]=c,void window.setTimeout(function(){b._element.setCustomValidity("")},2e3))},20)}}}},__input_binding.prototype.mirror=function(a){this._pass=!0,ctx=null==this.context?CONTEXT:this.context,ctx[this.from]=a,this._pass=!1},__input_binding.prototype.clean=function(){infos._element.removeEventListener(this._event,this.on_process_event)},__input_binding.prototype.populate=function(a,b,c){return this._pass?void 0:(a=this.convert_value(a,b),null===a||void 0===a||""===a?(this._element.placeholder=this.fallback,void("value"==this.to?this._element.value="":this._element[this.to]=this.fallback)):void(this._element[this.to]=a))};var __webservice_param_regex=new RegExp(/([\w_-]+)=(\??\$\w[\w_\d]+)/g);__webservice_parameter.prototype.getParameter=function(a){if(value=a[this.value],null==value){if(this.important)throw Error();return this.name+"="}return this.name+"="+encodeURI(value)},__webservice_parameter.prototype.toString=function(){return this.value},__webservice_url.prototype.getURL=function(a){try{if(url=this._url,this._param_str.length>0){for(url+="?",str=this._param_str,upi=0;upi<this._params.length;upi++)v=this._params[upi].getParameter(a),str=str.replace("{"+upi+"}",v);url+=str}return url}catch(b){return null}},__webservice_url.prototype.getParametersNames=function(){return this._params.join(",")};var xhr_timeout=4e3;__webservice_model_binding.prototype=new __model_binding,__webservice_model_binding.prototype.init=function(a){if(void 0!=this._url&&void 0==a[this._prop_name]){a[this._prop_name]=null;var b=this._prop_name;Object.defineProperty(a,this.from,{get:function(){return this[b]}})}},__webservice_model_binding.prototype.populate=function(a,b,c){c?__model_binding.prototype.populate.call(this,a,b):(url=this._url.getURL(b),url&&__load_async_datas(url,b,this._prop_name,this.from))};var __uuid_date=null,CONTEXT=null,BINDINGS=[],MODELS={},__verif_regex__=new RegExp(/[^\{]*(\{binding[^\}]+\})/g),__regex__=new RegExp(/(?:\s+([\w_\-]+):((?:https?:\/\/[^ ]+)|(?:\$\w[\w_\d]+)|(?:'[^']+')|(?:\[[\$']?[\$'\w\s,\._;%\-]+(?:,[\$']?[\$'\w\s,\._;%\-]+)*\])|(?:[^\s\}]+)))/g);window.addEventListener("load",AppInit)});
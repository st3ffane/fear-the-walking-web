//--require property_binding

/*
  ----------------------------------------------------------------------------
  "THE BEER-WARE LICENSE" (Revision 42):
  <steph.ponteins@gmail.com> wrote this file. As long as you retain this notice you
  can do whatever you want with this stuff. If we meet some day, and you think
  this stuff is worth it, you can buy me a beer in return.
  ----------------------------------------------------------------------------


  Fear the walking web - Flesh & Bones - 0.3 - rewrite!

  
  input_binding.js: j'ai un gros probleme de closure ici...

*/
  
/*binding d'un element de formulaire (input?)*/
function __input_binding(infos){
	__prop_binding.call(this, infos);
	this._pass = false;					//pour firefox mobile!
        this.return_value = infos.return_value;                 //force a retourner la propriete "value" de l'input
        
        
       	this._event =infos.event == null ? 'change' : infos.event;//qd envoyer les infos de changement
	//par defaut, sur le lost focus/enter ?
	
        //dans le cas ou le binding se trouve dans la page directement, lie le context global
        if (infos.process_event){
                //forcement le context global
                this.init(CONTEXT);
        }
}




__input_binding.prototype=new __prop_binding( );

__input_binding.prototype.init = function(context){
                this._element.addEventListener(this._event, this.on_process_event);
                this.context = context;//enregistre le context de donn�es pour plus tard....
		//penser a nettoyer ca plus tard...
                this._element._input_binding = this;
        }
__input_binding.prototype.on_process_event = function(evt){

                var bind = this._input_binding;
                if(bind == null || bind.context == null) return;
                
                
		var value = bind.return_value === true ? this.value : this[bind.to];
                if(value == null || value == undefined || value=="") {
                    this.placeholder = bind.fallback;
                    
                }
                
                
		try{
			bind.mirror(value);//appel a methode mirror de l'event, ie evite le notify
			this.setCustomValidity("");
                        
		}catch(err){
			
			this.setCustomValidity(err.message);
                        
                        //si a un formulaire, utilise la validation pour afficher les popups
                        if (this.form){
                                if(this.form.reportValidity){
                                        window.setTimeout(function(){
                                                //PROBLEME DE CLOSURE ICI: bind
                                                bind._element.form.reportValidity();//doit empecher le submit normalement et afficher les messages d'erreurs...
                                                //remet la valeur par defaut, voir si c'est le comportement le plus normal
                                                var value = bind.convert_value (bind.context[bind.from], bind.context);
                                                if(value === null || value === undefined || value==="") {
                                                    bind._element.placeholder = this.fallback;
                                                    return;
                                                }
                                                //met a jour l'UI
                                                bind._element[bind.to] = value;
                                                                
                                                //supprime le message d'erreur, probleme, doit attendre un peu...
                                                window.setTimeout(function(){
                                                                bind._element.setCustomValidity("");
                                                        },2000);
                                        });
                                }
                                else {
                                        //recupere le bouton submit si existe...
                                        form = bind._element.form;
                                        
                                        for (i=form.length-1;i>=0;i--){
                                                var input = form[i];
                                                if (input.getAttribute("type")=="submit") {
                                                        window.setTimeout(function(){
                                                                input.click();
                                                                
                                                                 //remet la valeur????
                                                                value = bind.convert_value (bind.context[bind.from], bind.context);
                                                                if(value === null || value === undefined || value==="") 
                                                                    bind._element.placeholder = this.fallback;
                                                                    bind._element.value="";
                                                                    return;
                                                                }
                                                                //met a jour l'UI
                                                                bind._element[bind.to] = value;
                                                                
                                                                //remet le custom validity a null?
                                                                //supprime le message d'erreur, probleme, doit attendre un peu...
                                                                window.setTimeout(function(){
                                                                        bind._element.setCustomValidity("");
                                                                        //("Remise a zero de la custom validity...");
                                                                },2000);//laisse le message 1sec
                                                                
                                                        }, 20);
                                                        return;
                                                }
                                        }
                                       
                                }
                                
                        }
		}
};


//met a jour la donnée javascript
//@param value: la valeur entrée par l'utilisateur
__input_binding.prototype.mirror = function(value){
		this._pass = true;
		ctx = this.context == null ? CONTEXT : this.context;
                ctx[this.from] = value;
		this._pass=false;
    }

//@deprecated
__input_binding.prototype.clean = function(){
		//supprime l'event listener
		infos._element.removeEventListener(this._event, this.on_process_event);
	}
        
        
        
__input_binding.prototype.populate = function(value, context, extra){
                
                //doit mettre en place les events
		if(this._pass){ //firefox mobile! si change la value programmatiquement, lance qd meme l'event change/input
                
			return;
		}

                //une property de l'element, modifie directement et completement
		value = this.convert_value (value, context);
                if(value === null || value === undefined || value==="") {
                    this._element.placeholder = this.fallback;
                    if (this.to == "value") this._element.value="";//laisse le placeholder
                    else    this._element[this.to]=this.fallback;
                    return;
                }
		//met a jour l'UI
		this._element[this.to] = value;
    }


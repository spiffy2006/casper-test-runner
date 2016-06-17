/**
 * Created by jcox on 6/16/16.
 */
class ConfigMapper {}

/**
 * Replaces default values with custom values
 * 
 * @param {Object} defaults The default values
 * @param {Object} custom The custom values
 * 
 * @returns {{}}
 */
ConfigMapper.map = (defaults, custom) => {
    let mapped = {};
    
    for (let k in defaults) {
        if (custom[k]) {
            mapped[k] = custom[k];
        } else {
            mapped[k] = defaults[k];
        }
    }
    
    return mapped;
};

export default ConfigMapper;
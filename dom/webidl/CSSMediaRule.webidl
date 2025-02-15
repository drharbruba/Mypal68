/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * The origin of this IDL file is
 * https://drafts.csswg.org/cssom/#the-cssmediarule-interface
 * https://drafts.csswg.org/css-conditional/#the-cssmediarule-interface
 */

// https://drafts.csswg.org/cssom/#the-cssmediarule-interface and
// https://drafts.csswg.org/css-conditional/#the-cssmediarule-interface
// except they disagree with each other.  We're taking the inheritance from
// css-conditional and the PutForwards behavior from cssom.
[Exposed=Window]
interface CSSMediaRule : CSSConditionRule {
  [SameObject, PutForwards=mediaText] readonly attribute MediaList media;
};
